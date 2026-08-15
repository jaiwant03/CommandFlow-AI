const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/commandflow_ai', {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[Database] Mongo Connection Warning: ${error.message}. Running in fallback mode.`);
  }
};

module.exports = connectDB;
