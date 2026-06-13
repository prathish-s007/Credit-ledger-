import mongoose from 'mongoose';

/**
 * Connect to MongoDB Database
 * Supports local MongoDB Server and MongoDB Atlas cluster via MONGO_URI env variable.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌  Error: MONGO_URI environment variable is not defined.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`\n💾  MongoDB Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌  Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
