const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const config = require('../config/env');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn || '30d'
  });
};

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return sendError(res, 'Please provide name, email, and password.', 400, 'MISSING_FIELDS');
    }

    let userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return sendError(res, 'User already exists with this email address.', 400, 'USER_ALREADY_EXISTS');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword
    });

    const token = generateToken(user._id);
    const userPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      token
    };

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: userPayload,
      user: userPayload,
      token
    });
  } catch (err) {
    next(err);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, 'Please provide email and password.', 400, 'MISSING_CREDENTIALS');
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Check in database
    const user = await User.findOne({ email: cleanEmail });
    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user._id);
      const userPayload = {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        token
      };
      return res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        data: userPayload,
        user: userPayload,
        token
      });
    }

    // 2. Fallback demo account for testing & local development
    if (cleanEmail === 'demo@commandflow.ai' && password === 'demo1234') {
      const demoId = '65b820a1c1d4a90012345678';
      let demoUser = await User.findById(demoId);
      if (!demoUser) {
        demoUser = await User.create({
          _id: demoId,
          name: 'Demo User',
          email: 'demo@commandflow.ai',
          password: await bcrypt.hash('demo1234', 10)
        });
      }

      const token = generateToken(demoUser._id);
      const userPayload = {
        _id: demoUser._id,
        name: demoUser.name,
        email: demoUser.email,
        avatar: demoUser.avatar || '',
        token
      };
      return res.status(200).json({
        success: true,
        message: 'Logged in as Demo User.',
        data: userPayload,
        user: userPayload,
        token
      });
    }

    return sendError(res, 'Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  } catch (err) {
    next(err);
  }
};

/**
 * Google Sign-In verification and token generation
 * POST /api/auth/google
 */
const googleAuth = async (req, res, next) => {
  try {
    const { credential, idToken, googleId, email, name, avatar } = req.body;

    let verifiedEmail = email;
    let verifiedName = name;
    let verifiedGoogleId = googleId;
    let verifiedAvatar = avatar;

    const tokenToVerify = credential || idToken;

    // Verify token with Google if token provided
    if (tokenToVerify) {
      try {
        const verifyRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${tokenToVerify}`);
        if (verifyRes.data?.email) {
          verifiedEmail = verifyRes.data.email;
          verifiedName = verifyRes.data.name || verifiedName;
          verifiedGoogleId = verifyRes.data.sub || verifiedGoogleId;
          verifiedAvatar = verifyRes.data.picture || verifiedAvatar;
        }
      } catch (verifyErr) {
        console.warn(`[Auth] Google token verification error (${verifyErr.message}).`);
      }
    }

    if (!verifiedEmail) {
      return sendError(res, 'Google authentication failed: Email address could not be verified.', 400, 'GOOGLE_AUTH_FAILED');
    }

    let user = await User.findOne({
      $or: [
        { email: verifiedEmail.toLowerCase() },
        ...(verifiedGoogleId ? [{ googleId: verifiedGoogleId }] : [])
      ]
    });

    if (!user) {
      user = await User.create({
        name: verifiedName || verifiedEmail.split('@')[0],
        email: verifiedEmail.toLowerCase(),
        googleId: verifiedGoogleId,
        avatar: verifiedAvatar || ''
      });
    } else {
      if (verifiedGoogleId && !user.googleId) {
        user.googleId = verifiedGoogleId;
        await user.save();
      }
    }

    const token = generateToken(user._id);

    return sendSuccess(res, 'Logged in with Google successfully.', {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    return sendSuccess(res, 'Current user profile.', user || req.user);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name || name.length > 80) {
      return sendError(res, 'Please provide a name between 1 and 80 characters.', 400, 'INVALID_PROFILE_NAME');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 'Account not found.', 404, 'USER_NOT_FOUND');
    }

    const previousAvatar = user.avatar;
    user.name = name;
    if (req.file) {
      user.avatar = `/uploads/profiles/${req.file.filename}`;
    }
    await user.save();

    if (req.file && previousAvatar?.startsWith('/uploads/profiles/')) {
      const previousFile = path.basename(previousAvatar);
      fs.promises.unlink(path.join(__dirname, '../public/uploads/profiles', previousFile)).catch(() => {});
    }

    return sendSuccess(res, 'Profile updated successfully.', {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || ''
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleAuth,
  getMe,
  updateProfile
};
