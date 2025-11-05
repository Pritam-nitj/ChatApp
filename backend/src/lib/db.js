import mongoose from 'mongoose';

// A global variable to hold the cached connection
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  // If we have a cached connection, use it
  if (cached.conn) {
    return cached.conn;
  }

  // If there's no promise, create a new connection
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI).then((mongoose) => {
      console.log('Connected to MongoDB');
      return mongoose;
    });
  }

  // Await the promise to get the connection
  cached.conn = await cached.promise;
  return cached.conn;
};
