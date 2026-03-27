import mongoose from "mongoose";

export const usernamePattern = /^[a-zA-Z0-9_]{3,30}$/;

export const validateUsername = (username) => usernamePattern.test(username || "");

export const validatePassword = (password) => typeof password === "string" && password.length >= 5;

export const validateObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
