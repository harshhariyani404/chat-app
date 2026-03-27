import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import user from "../models/user.js";
import { env } from "../config/env.js";
import { ApiError, handleControllerError, sanitizeUser } from "../utils/http.js";
import { validatePassword, validateUsername } from "../utils/validation.js";

export const signup = async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const { password } = req.body;

    if (!validateUsername(username)) {
      throw new ApiError(400, "Username must be 3-30 characters and contain only letters, numbers, or underscores");
    }

    if (!validatePassword(password)) {
      throw new ApiError(400, "Password must be at least 6 characters long");
    }

    const userExists = await user.findOne({ username });

    if (userExists) {
      throw new ApiError(409, "User already exists");
    }

    const hashed = await bcrypt.hash(password, 10);
    await user.create({ username, password: hashed });

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    handleControllerError(res, error, "Unable to create user");
  }
};

export const login = async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const { password } = req.body;

    if (!validateUsername(username)) {
      throw new ApiError(400, "Username must be 3-30 characters and contain only letters, numbers, or underscores");
    }

    if (!validatePassword(password)) {
      throw new ApiError(400, "Password must be at least 6 characters long");
    }

    if (!env.jwtSecret) {
      throw new ApiError(500, "JWT_SECRET is required");
    }

    const existingUser = await user.findOne({ username });

    if (!existingUser) {
      throw new ApiError(401, "Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      throw new ApiError(401, "Invalid credentials");
    }

    const token = jwt.sign({ id: existingUser._id }, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn,
    });

    res.status(200).json({ token, user: sanitizeUser(existingUser) });
  } catch (error) {
    handleControllerError(res, error, "Unable to log in");
  }
};
