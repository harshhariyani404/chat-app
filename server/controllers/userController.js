import fs from "fs";
import User from "../models/user.js";
import Message from "../models/message.js";
import contact from "../models/contact.js";
import cloudinary from "../config/cloudinary.js";
import { ApiError, handleControllerError, sanitizeUser } from "../utils/http.js";
import { escapeRegex, validateObjectId, validateUsername } from "../utils/validation.js";

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.userId },
    }).select("-password").lean();

    res.json(users);
  } catch (error) {
    handleControllerError(res, error, "Error fetching users");
  }
};

export const updateProfile = async (req, res) => {
  try {
    const username = req.body.username?.trim();
    let avatar = null;

    const existingUser = await User.findById(req.userId);

    if (!existingUser) {
      throw new ApiError(404, "User not found");
    }

    if (username && !validateUsername(username)) {
      throw new ApiError(400, "Username must be 3-30 characters and contain only letters, numbers, or underscores");
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "chat-app/avatars",
      });

      avatar = {
        url: result.secure_url,
        publicId: result.public_id,
      };

      if (existingUser.avatar?.publicId) {
        await cloudinary.uploader.destroy(existingUser.avatar.publicId);
      }

      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (avatar) updateData.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(req.userId, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({ user: sanitizeUser(updatedUser) });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    handleControllerError(res, error, "Profile update failed");
  }
};

export const getUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!validateObjectId(userId)) {
      throw new ApiError(400, "Invalid user id");
    }

    const foundUser = await User.findById(userId).select("isOnline lastSeen");

    if (!foundUser) {
      throw new ApiError(404, "User not found");
    }

    res.json(foundUser);
  } catch (error) {
    handleControllerError(res, error, "Error fetching user status");
  }
};

export const getChatUsers = async (req, res) => {
  try {
    const { myId } = req.params;

    if (!validateObjectId(myId)) {
      throw new ApiError(400, "Invalid user id");
    }

    const messages = await Message.find({
      $or: [{ from: myId }, { to: myId }],
    }).select("from to").lean();

    const userIds = new Set();

    messages.forEach((msg) => {
      if (msg.from.toString() !== myId) {
        userIds.add(msg.from.toString());
      }

      if (msg.to.toString() !== myId) {
        userIds.add(msg.to.toString());
      }
    });

    const users = await User.find({
      _id: { $in: Array.from(userIds) },
    }).select("-password").lean();

    const contacts = await contact.find({ user: myId }).lean();

    const result = users.map((currentUser) => {
      const existingContact = contacts.find(
        (entry) => entry.contactUser.toString() === currentUser._id.toString()
      );

      return {
        ...currentUser,
        displayName: existingContact?.nickname || currentUser.username,
      };
    });

    res.json(result);
  } catch (error) {
    handleControllerError(res, error, "Error fetching chat users");
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query?.trim()) {
      return res.json([]);
    }

    const users = await User.find({
      _id: { $ne: req.userId },
      username: { $regex: escapeRegex(query.trim()), $options: "i" },
    }).select("-password").limit(20).lean();

    res.json(users);
  } catch (error) {
    handleControllerError(res, error, "Error searching users");
  }
};
