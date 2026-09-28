const mongoose = require('mongoose');
const dns = require('dns');
const path = require('path');
const dotenv = require('dotenv');

// Avoid overriding system DNS globally which causes c-ares timeouts on networks blocking UDP 53


// Ensure environment variables are loaded
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Dynamically converts a mongodb+srv:// URI into direct replica-set shard endpoints
 * using ONLY credentials provided in the environment variable. Zero hardcoded secrets.
 */
const getDirectReplicaUri = (srvUri) => {
  if (process.env.MONGO_DIRECT_URI) return process.env.MONGO_DIRECT_URI;
  if (!srvUri || !srvUri.startsWith('mongodb+srv://')) return srvUri;
  const match = srvUri.match(/mongodb\+srv:\/\/([^@]+)@([^/?]+)(?:\/([^?]+))?(?:\?(.*))?/);
  if (!match) return srvUri;
  const [, auth, host, dbName] = match;
  if (host.includes('86qnngi.mongodb.net')) {
    const database = dbName || 'commandflow_ai';
    return `mongodb://${auth}@ac-tcnco3n-shard-00-00.86qnngi.mongodb.net:27017,ac-tcnco3n-shard-00-01.86qnngi.mongodb.net:27017,ac-tcnco3n-shard-00-02.86qnngi.mongodb.net:27017/${database}?ssl=true&replicaSet=atlas-lo3sgf-shard-0&authSource=admin&retryWrites=true&w=majority`;
  }
  return srvUri;
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
  let uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/commandflow_ai';
  if (process.env.MONGO_DIRECT_URI) {
    uri = process.env.MONGO_DIRECT_URI;
  } else if (process.platform === 'win32' && uri.startsWith('mongodb+srv://')) {
    const directUri = getDirectReplicaUri(uri);
    if (directUri && directUri !== uri) {
      uri = directUri;
    }
  }

  const connectionOptions = {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4
  };

  try {
    const conn = await mongoose.connect(uri, connectionOptions);
    return conn;
  } catch (error) {
    // If SRV lookup fails on Windows, convert dynamically using env credentials
    if (uri.startsWith('mongodb+srv://') || error.message.includes('querySrv') || error.message.includes('ECONNREFUSED')) {
      const fallbackUri = getDirectReplicaUri(uri);
      if (fallbackUri && fallbackUri !== uri) {
        console.warn(`[Database] SRV lookup issue encountered: ${error.message}. Connecting directly via Atlas replica-set shards...`);
        try {
          const conn = await mongoose.connect(fallbackUri, connectionOptions);
          return conn;
        } catch (directErr) {
          console.error(`[Database] Atlas Replica-set Connection Error: ${directErr.message}`);
        }
      }
    }

    console.warn(`[Database] Mongo Connection Warning: ${error.message}. Running in fallback mode.`);
  }
};

module.exports = connectDB;



