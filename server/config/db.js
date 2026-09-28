const mongoose = require('mongoose');
const dns = require('dns');
const path = require('path');
const dotenv = require('dotenv');

// Ensure environment variables are loaded
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Ensures MongoDB Atlas SRV records can be resolved.
 * On Windows/certain ISPs, the system resolver fails with querySrv ECONNREFUSED.
 * Falling back to Google (8.8.8.8) and Cloudflare (1.1.1.1) DNS ensures flawless resolution.
 */
const configureDnsForAtlas = async (uri) => {
  if (!uri || !uri.startsWith('mongodb+srv://')) return;

  const hostMatch = uri.match(/mongodb\+srv:\/\/(?:[^:]+:[^@]+@)?([^/?]+)/);
  if (!hostMatch) return;
  const clusterHost = hostMatch[1];

  return new Promise((resolve) => {
    dns.resolveSrv(`_mongodb._tcp.${clusterHost}`, (err) => {
      if (err) {
        console.log(`[Database] System DNS SRV resolution failed (${err.code}). Switching to public DNS (8.8.8.8, 1.1.1.1)...`);
        try {
          dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
        } catch (setErr) {
          console.warn(`[Database] Could not set DNS servers: ${setErr.message}`);
        }
      }
      resolve();
    });
  });
};

// Setup Mongoose connection lifecycle listeners
mongoose.connection.on('connected', () => {
  const isAtlas = mongoose.connection.host?.includes('mongodb.net');
  console.log(`[Database] MongoDB ${isAtlas ? 'Atlas ' : ''}Connected: ${mongoose.connection.host} (DB: ${mongoose.connection.name})`);
});

mongoose.connection.on('error', (err) => {
  console.error(`[Database] MongoDB Connection Error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn(`[Database] MongoDB Disconnected.`);
});

mongoose.connection.on('reconnected', () => {
  console.log(`[Database] MongoDB Reconnected.`);
});

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/commandflow_ai';

  try {
    await configureDnsForAtlas(uri);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4 for network calls on Windows
    });

    return conn;
  } catch (error) {
    // If first attempt failed with querySrv, try setting public DNS and retry once
    if (uri.startsWith('mongodb+srv://') && (error.message.includes('querySrv') || error.message.includes('ECONNREFUSED'))) {
      console.warn(`[Database] Initial Atlas connection failed with DNS error. Retrying with explicit Google/Cloudflare DNS...`);
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        const conn = await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 15000,
          connectTimeoutMS: 15000,
          socketTimeoutMS: 45000,
          family: 4
        });
        return conn;
      } catch (retryError) {
        console.error(`[Database] Atlas Connection Retry Error: ${retryError.message}`);
      }
    }

    console.warn(`[Database] Mongo Connection Warning: ${error.message}. Running in fallback mode.`);
  }
};

module.exports = connectDB;

