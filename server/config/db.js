import mongoose from "mongoose";
import { env } from "./env.js";

const connectDB = async () => {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI is required");
  }

  console.log(`[startup] connecting to MongoDB at ${env.mongoUri}`);

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log("[startup] MongoDB connected");
};

export default connectDB;
