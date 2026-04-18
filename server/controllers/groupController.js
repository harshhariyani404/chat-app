import Group from "../models/group.js";
import GroupMessage from "../models/groupMessage.js";
import User from "../models/user.js";
import { ApiError, handleControllerError } from "../utils/http.js";
import { validateObjectId } from "../utils/validation.js";

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

    await GroupMessage.deleteMany({ group: group._id });
    await group.deleteOne();

    res.json({ deleted: true });
  } catch (error) {
    handleControllerError(res, error, "Error deleting group");
  }
};
