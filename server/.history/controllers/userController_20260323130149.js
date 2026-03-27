import User from "../models/user.js";
import Message from "../models/message.js";
import contact from "../models/contact.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

export const getUsers = async (req, res) => {
  try {
    const myId = req.query.myId;

    const users = await User.find({
      _id: { $ne: myId }, // exclude me
    }).select("-password");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.userId;
    let avatarData = null;

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: "User not found" });
    }

    const trimmedUsername = username?.trim();

    if (trimmedUsername && trimmedUsername !== existingUser.username) {
      const usernameTaken = await User.findOne({
        username: trimmedUsername,
        _id: { $ne: userId },
      });

      if (usernameTaken) {
        if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "chat-app/avatars",
        resource_type: "image",
      });

      avatarData = {
        avatar: {
          url: result.secure_url,
          publicId: result.public_id,
        }
      };

      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      if (existingUser.avatar && existingUser.avatar.publicId) {
        await cloudinary.uploader.destroy(existingUser.avatar.publicId);
      }
    }

    const updateData = {};
    if (trimmedUsername) updateData.username = trimmedUsername;
    if (avatarData) Object.assign(updateData, avatarData);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (err) {
    console.log(err);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: "Profile update failed" });
  }
};

export const getUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const foundUser = await User.findById(userId).select("isOnline lastSeen");

    res.json(foundUser);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user status" });
  }
};



export const getChatUsers = async (req, res) => {
  try {
    const { myId } = req.params;

    const messages = await Message.find({
      $or: [{ from: myId }, { to: myId }],
    });

    const userIds = new Set();

    messages.forEach((msg) => {
      if (msg.from.toString() !== myId)
        userIds.add(msg.from.toString());

      if (msg.to.toString() !== myId)
        userIds.add(msg.to.toString());
    });

    const users = await User.find({
      _id: { $in: Array.from(userIds) },
    });

    const contacts = await contact.find({ user: myId });

    const result = users.map((u) => {
      const contact = contacts.find(
        (c) =>
          c.contactUser.toString() === u._id.toString()
      );

      return {
        ...u._doc,
        displayName: contact?.nickname || u.username, // 🔥 IMPORTANT
      };
    });

    res.json(result);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching chat users" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.json([]);
    }
    const users = await User.find({
      username: { $regex: query, $options: "i" },
    }).select("-password");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error searching users", error: error.message });
  }
};
