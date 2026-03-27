import fs from "fs";
import cloudinary from "../config/cloudinary.js";
import Message from "../models/message.js";
import User from "../models/user.js";
import { onlineUsers } from "../sockets/onlineUsers.js";
import { ApiError, handleControllerError } from "../utils/http.js";
import { validateObjectId } from "../utils/validation.js";

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
    const myId = req.userId;
    const otherUserId = req.params.userId;

    if (!validateObjectId(otherUserId)) {
      throw new ApiError(400, "Invalid user id");
    }

    const messages = await Message.find({
      $or: [
        { from: myId, to: otherUserId },
        { from: otherUserId, to: myId },
      ],
      deletedFor: { $nin: [myId] },
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    handleControllerError(res, error, "Error fetching messages");
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

    if (!validateObjectId(to)) {
      throw new ApiError(400, "Invalid recipient id");
    }

    if (!text && files.length === 0) {
      throw new ApiError(400, "Message text or files are required");
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
      status: "sent",
    });

    const sender = await User.findById(from).select("username");
    const io = req.app.get("io");

    if (onlineUsers[to]) {
      await Message.findByIdAndUpdate(savedMessage._id, {
        status: "delivered",
      });
      savedMessage.status = "delivered";
    }

    if (io) {
      if (onlineUsers[to]) {
        io.to(`user:${from}`).emit("message_status_update", {
          messageId: savedMessage._id,
          status: "delivered",
        });
      }

      io.to(`user:${to}`).emit("receive_message", savedMessage);
      io.to(`user:${to}`).emit("new_notification", {
        from,
        message: text || `${attachments.length} file${attachments.length > 1 ? "s" : ""} shared`,
        username: sender?.username || "Unknown User",
      });
      io.to(`user:${from}`).emit("receive_message", savedMessage);
    }

    res.status(201).json(savedMessage);
  } catch (error) {
    cleanupFiles();
    handleControllerError(res, error, "Error uploading message files");
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { newText } = req.body;

    if (!validateObjectId(messageId)) {
      throw new ApiError(400, "Invalid message id");
    }

    const message = await Message.findById(messageId);

    if (!message) {
      throw new ApiError(404, "Message not found");
    }

    if (message.from.toString() !== req.userId) {
      throw new ApiError(403, "Not allowed");
    }

    if (message.isDeletedForEveryone) {
      throw new ApiError(400, "Deleted messages cannot be edited");
    }

    if (!newText?.trim()) {
      throw new ApiError(400, "Message text cannot be empty");
    }

    const updated = await Message.findByIdAndUpdate(
      messageId,
      { message: newText.trim(), isEdited: true },
      { new: true }
    );

    const io = req.app.get("io");

    if (io) {
      io.to(`user:${updated.to}`).emit("message_edited", updated);
      io.to(`user:${updated.from}`).emit("message_edited", updated);
    }

    res.json(updated);
  } catch (error) {
    handleControllerError(res, error, "Error editing message");
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    if (!validateObjectId(messageId)) {
      throw new ApiError(400, "Invalid message id");
    }

    const message = await Message.findById(messageId);

    if (!message) {
      throw new ApiError(404, "Message not found");
    }

    if (message.from.toString() !== userId) {
      throw new ApiError(403, "Not allowed");
    }

    if (message.isDeletedForEveryone) {
      throw new ApiError(400, "Message already deleted for everyone");
    }

    message.isDeletedForEveryone = true;
    message.message = "This message was deleted";
    message.attachments = [];
    message.isEdited = false;

    await message.save();

    const io = req.app.get("io");

    if (io) {
      io.to(`user:${message.to}`).emit("message_deleted_for_everyone", message);
      io.to(`user:${message.from}`).emit("message_deleted_for_everyone", message);
    }

    res.json({ msg: "Deleted for everyone", message });
  } catch (error) {
    handleControllerError(res, error, "Error deleting message");
  }
};

export const deleteForMe = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    if (!validateObjectId(messageId)) {
      throw new ApiError(400, "Invalid message id");
    }

    const message = await Message.findById(messageId);

    if (!message) {
      throw new ApiError(404, "Message not found");
    }

    const isParticipant =
      message.from.toString() === userId || message.to.toString() === userId;

    if (!isParticipant) {
      throw new ApiError(403, "Not allowed");
    }

    if (!message.deletedFor.includes(userId)) {
      message.deletedFor.push(userId);
    }

    await message.save();

    const io = req.app.get("io");

    if (io) {
      io.to(`user:${userId}`).emit("message_deleted_for_me", {
        messageId,
        userId,
      });
    }

    res.json({ msg: "Deleted for me", messageId });
  } catch (error) {
    handleControllerError(res, error, "Error deleting message for me");
  }
};
