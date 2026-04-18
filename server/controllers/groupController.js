import fs from "fs";
import cloudinary from "../config/cloudinary.js";
import Group from "../models/group.js";
import GroupMessage from "../models/groupMessage.js";
import User from "../models/user.js";
import { onlineUsers } from "../sockets/onlineUsers.js";
import { ApiError, handleControllerError } from "../utils/http.js";
import { validateObjectId } from "../utils/validation.js";

const emitToUser = (io, userId, event, payload) => {
  io.to(`user:${userId}`).emit(event, payload);
};

const getCloudinaryResourceType = (mimeType = "") => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "raw";
};

const groupNotificationPreview = (message, attachments = []) => {
  if (message?.trim()) {
    return message;
  }

  if (attachments.length > 0) {
    return `${attachments.length} file${attachments.length > 1 ? "s" : ""} shared`;
  }

  return "";
};

const populateGroup = () => ({
  path: "members",
  select: "username avatar",
});

const populateAdmin = () => ({
  path: "admin",
  select: "username avatar",
});

export const createGroup = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, memberIds = [] } = req.body;

    if (!name?.trim()) {
      throw new ApiError(400, "Group name is required");
    }

    const uniqueMembers = [...new Set([...memberIds.map(String), String(userId)])].filter((id) =>
      validateObjectId(id)
    );

    if (uniqueMembers.length < 2) {
      throw new ApiError(400, "Add at least one other member");
    }

    const group = await Group.create({
      name: name.trim(),
      members: uniqueMembers,
      admin: userId,
    });

    const populated = await Group.findById(group._id)
      .populate(populateGroup())
      .populate(populateAdmin())
      .lean();

    res.status(201).json(populated);
  } catch (error) {
    handleControllerError(res, error, "Error creating group");
  }
};

export const listMyGroups = async (req, res) => {
  try {
    const userId = req.userId;

    const groups = await Group.find({ members: userId })
      .populate(populateGroup())
      .populate(populateAdmin())
      .sort({ updatedAt: -1 })
      .lean();

    res.json(groups);
  } catch (error) {
    handleControllerError(res, error, "Error listing groups");
  }
};

export const getGroup = async (req, res) => {
  try {
    const userId = req.userId;
    const { groupId } = req.params;

    if (!validateObjectId(groupId)) {
      throw new ApiError(400, "Invalid group id");
    }

    const group = await Group.findOne({
      _id: groupId,
      members: userId,
    })
      .populate(populateGroup())
      .populate(populateAdmin())
      .lean();

    if (!group) {
      throw new ApiError(404, "Group not found");
    }

    res.json(group);
  } catch (error) {
    handleControllerError(res, error, "Error fetching group");
  }
};

export const addMembers = async (req, res) => {
  try {
    const userId = req.userId;
    const { groupId } = req.params;
    const { memberIds = [] } = req.body;

    if (!validateObjectId(groupId)) {
      throw new ApiError(400, "Invalid group id");
    }

    const group = await Group.findById(groupId);

    if (!group) {
      throw new ApiError(404, "Group not found");
    }

    if (group.admin.toString() !== userId) {
      throw new ApiError(403, "Only the admin can add members");
    }

    const toAdd = memberIds.filter((id) => validateObjectId(id)).map((id) => String(id));

    for (const id of toAdd) {
      if (!group.members.map((m) => m.toString()).includes(id)) {
        group.members.push(id);
      }
    }

    await group.save();

    const populated = await Group.findById(group._id)
      .populate(populateGroup())
      .populate(populateAdmin())
      .lean();

    res.json(populated);
  } catch (error) {
    handleControllerError(res, error, "Error adding members");
  }
};

export const removeMember = async (req, res) => {
  try {
    const userId = req.userId;
    const { groupId, memberId } = req.params;

    if (!validateObjectId(groupId) || !validateObjectId(memberId)) {
      throw new ApiError(400, "Invalid id");
    }

    const group = await Group.findById(groupId);

    if (!group) {
      throw new ApiError(404, "Group not found");
    }

    const isAdmin = group.admin.toString() === userId;
    const isSelf = memberId === userId;

    if (!isAdmin && !isSelf) {
      throw new ApiError(403, "Not allowed");
    }

    const wasAdmin = memberId === group.admin.toString();

    group.members = group.members.filter((m) => m.toString() !== memberId);

    if (group.members.length === 0) {
      if (group.avatar?.publicId) {
        await cloudinary.uploader.destroy(group.avatar.publicId).catch(() => {});
      }
      await GroupMessage.deleteMany({ group: group._id });
      await group.deleteOne();
      return res.json({ deleted: true });
    }

    if (wasAdmin) {
      group.admin = group.members[0];
    }

    await group.save();

    const populated = await Group.findById(group._id)
      .populate(populateGroup())
      .populate(populateAdmin())
      .lean();

    res.json(populated);
  } catch (error) {
    handleControllerError(res, error, "Error removing member");
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { groupId } = req.params;

    if (!validateObjectId(groupId)) {
      throw new ApiError(400, "Invalid group id");
    }

    const allowed = await Group.findOne({ _id: groupId, members: userId }).select("_id").lean();

    if (!allowed) {
      throw new ApiError(404, "Group not found");
    }

    const messages = await GroupMessage.find({ group: groupId })
      .populate("from", "username avatar")
      .sort({ createdAt: 1 })
      .lean();

    res.json(messages);
  } catch (error) {
    handleControllerError(res, error, "Error fetching group messages");
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const userId = req.userId;
    const { groupId } = req.params;

    if (!validateObjectId(groupId)) {
      throw new ApiError(400, "Invalid group id");
    }

    const group = await Group.findById(groupId);

    if (!group) {
      throw new ApiError(404, "Group not found");
    }

    if (group.admin.toString() !== userId) {
      throw new ApiError(403, "Only the admin can delete the group");
    }

    if (group.avatar?.publicId) {
      await cloudinary.uploader.destroy(group.avatar.publicId).catch(() => {});
    }

    await GroupMessage.deleteMany({ group: group._id });
    await group.deleteOne();

    res.json({ deleted: true });
  } catch (error) {
    handleControllerError(res, error, "Error deleting group");
  }
};

export const patchGroup = async (req, res) => {
  try {
    const userId = req.userId;
    const { groupId } = req.params;

    if (!validateObjectId(groupId)) {
      throw new ApiError(400, "Invalid group id");
    }

    const group = await Group.findById(groupId);

    if (!group) {
      throw new ApiError(404, "Group not found");
    }

    if (group.admin.toString() !== userId) {
      throw new ApiError(403, "Only the admin can update the group profile");
    }

    const rawName = req.body.name;
    const rawDescription = req.body.description;
    const clearAvatar = req.body.clearAvatar === true || req.body.clearAvatar === "true";

    if (rawName !== undefined) {
      const n = String(rawName).trim();
      if (n.length < 1) {
        throw new ApiError(400, "Group name cannot be empty");
      }

      if (n.length > 120) {
        throw new ApiError(400, "Group name is too long");
      }

      group.name = n;
    }

    if (rawDescription !== undefined) {
      group.description = String(rawDescription).trim().slice(0, 500);
    }

    if (clearAvatar && group.avatar?.publicId) {
      await cloudinary.uploader.destroy(group.avatar.publicId).catch(() => {});
      group.avatar = { url: "", publicId: "" };
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "chat-app/group-avatars",
      });

      if (group.avatar?.publicId) {
        await cloudinary.uploader.destroy(group.avatar.publicId).catch(() => {});
      }

      group.avatar = {
        url: result.secure_url,
        publicId: result.public_id,
      };

      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }

    await group.save();

    const populated = await Group.findById(group._id)
      .populate(populateGroup())
      .populate(populateAdmin())
      .lean();

    res.json(populated);
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    handleControllerError(res, error, "Error updating group");
  }
};

export const uploadGroupMessageFiles = async (req, res) => {
  const cleanupFiles = () => {
    for (const file of req.files || []) {
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  };

  try {
    const userId = req.userId;
    const { groupId } = req.params;
    const text = req.body.message?.trim() || "";
    const files = req.files || [];

    if (!validateObjectId(groupId)) {
      throw new ApiError(400, "Invalid group id");
    }

    const group = await Group.findOne({ _id: groupId, members: userId });

    if (!group) {
      throw new ApiError(404, "Group not found");
    }

    if (!text && files.length === 0) {
      throw new ApiError(400, "Message text or files are required");
    }

    const attachments = await Promise.all(
      files.map(async (file) => {
        const uploadResourceType = getCloudinaryResourceType(file.mimetype);
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "chat-app/group-messages",
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

    const saved = await GroupMessage.create({
      group: groupId,
      from: userId,
      message: text,
      attachments,
      status: "sent",
    });

    const populated = await GroupMessage.findById(saved._id).populate("from", "username avatar").lean();

    const io = req.app.get("io");

    if (io) {
      io.to(`group:${groupId}`).emit("group-message", populated);

      const memberIds = group.members.map((m) => m.toString()).filter((id) => id !== String(userId));
      const sender = await User.findById(userId).select("username");

      for (const uid of memberIds) {
        if (onlineUsers[uid]) {
          emitToUser(io, uid, "new_notification", {
            from: userId,
            groupId,
            message: groupNotificationPreview(text, attachments),
            username: sender?.username || "Someone",
            isGroup: true,
          });
        }
      }
    }

    res.status(201).json(populated);
  } catch (error) {
    cleanupFiles();
    handleControllerError(res, error, "Error uploading group files");
  }
};
