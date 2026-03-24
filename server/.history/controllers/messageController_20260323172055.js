import fs from "fs";
import cloudinary from "../config/cloudinary.js";
import Message from "../models/message.js";
import User from "../models/user.js";

const getCloudinaryResourceType = (mimeType = "") => {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  return "raw";
};

export const getMessages = async (req, res) => {
  try {
    const myId = req.userId; // from JWT
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { from: myId, to: otherUserId },
        { from: otherUserId, to: myId },
      ],
      deletedFor: { $nin: [myId] },
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error fetching messages" });
  }
};

export const uploadMessageFiles = async (req, res) => {
  const cleanupFiles = () => {
    for (const file of req.files || []) {
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  };

  try {
    const from = req.userId;
    const to = req.params.userId;
    const text = req.body.message?.trim() || "";
    const files = req.files || [];

    if (!text && files.length === 0) {
      return res.status(400).json({ message: "Message text or files are required" });
    }

    const attachments = await Promise.all(
      files.map(async (file) => {
        const uploadResourceType = getCloudinaryResourceType(file.mimetype);
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "chat-app/messages",
          resource_type: uploadResourceType,
          use_filename: true,
          unique_filename: true,
        });

        return {
          url: result.secure_url,
          publicId: result.public_id,
          originalName: file.originalname,
          mimeType: file.mimetype,
          resourceType: uploadResourceType,
          format: result.format || file.originalname.split(".").pop() || "",
          bytes: result.bytes || 0,
        };
      })
    );

    cleanupFiles();

    const savedMessage = await Message.create({
      from,
      to,
      message: text,
      attachments,
    });

    const sender = await User.findById(from).select("username");
    const io = req.app.get("io");

    if (io) {
      io.to(`user:${to}`).emit("receive_message", savedMessage);
      io.to(`user:${to}`).emit("new_notification", {
        from,
        message: text || `${attachments.length} file${attachments.length > 1 ? "s" : ""} shared`,
        username: sender?.username || "Unknown User",
      });
      io.to(`user:${from}`).emit("receive_message", savedMessage);
    }

    res.status(201).json(savedMessage);
  } catch (err) {
    console.log(err);
    cleanupFiles();
    res.status(500).json({ msg: "Error uploading message files" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { newText } = req.body;
    
    const updated = await Message.findByIdAndUpdate(
      messageId,
      { message: newText, isEdited: true },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error editing message" });
  }
}

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ msg: "Message not found" });
    }

    // Only sender can delete for everyone
    if (message.from.toString() !== userId) {
      return res.status(403).json({ msg: "Not allowed" });
    }

    // 🔹 delete for everyone (soft delete)
    message.isDeletedForEveryone = true;
    message.message = "This message was deleted";
    message.attachments = [];

    await message.save();

    const io = req.app.get("io");

    if (io) {
      io.to(`user:${message.to}`).emit("message_deleted", messageId);
      io.to(`user:${message.from}`).emit("message_deleted", messageId);
    }

    res.json({ msg: "Deleted for everyone" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error deleting message" });
  }
};

export const deleteForMe = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ msg: "Message not found" });
    }

    if (!message.deletedFor.includes(userId)) {
      message.deletedFor.push(userId);
    }

    await message.save();

    res.json({ msg: "Deleted for me" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error deleting message for me" });
  }
};