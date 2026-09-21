import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 5000, // fail fast instead of hanging
      bufferCommands: false,          // don't queue queries while disconnected
    };

    cached.promise = mongoose
      .connect(process.env.DATABASE_URL, opts)
      .then((mongoose) => {
        console.log("connect DB success");
        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // reset so next request can retry
    throw err; // IMPORTANT: don't swallow it
  }

  return cached.conn;
};

export { connectDB };