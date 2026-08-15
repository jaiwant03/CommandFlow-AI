const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'commandflow_ai_super_secret_jwt_key_2026', {
    expiresIn: '30d'
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all fields.' });
    }

    let userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (user && (await bcrypt.compare(password, user.password))) {
      return res.json({
        success: true,
        message: 'Logged in successfully.',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          token: generateToken(user._id)
        }
      });
    }

    // Fallback demo account for easy testing
    if (email === 'demo@commandflow.ai' && password === 'demo1234') {
      return res.json({
        success: true,
        message: 'Logged in as Demo User.',
        user: {
          _id: '65b820a1c1d4a90012345678',
          name: 'Demo User',
          email: 'demo@commandflow.ai',
          token: generateToken('65b820a1c1d4a90012345678')
        }
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user: user || req.user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe
};
