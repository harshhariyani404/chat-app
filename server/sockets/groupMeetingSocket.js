import crypto from "crypto";
import { MAX_MEETING_PARTICIPANTS } from "../config/meetingConfig.js";
import Group from "../models/group.js";
import GroupMessage from "../models/groupMessage.js";
import Meeting from "../models/meeting.js";
import User from "../models/user.js";
import { onlineUsers } from "./onlineUsers.js";

const emitToUser = (io, userId, event, payload) => {
  io.to(`user:${userId}`).emit(event, payload);
};

const getNotificationText = (message, attachments = []) => {
  if (message?.trim()) {
    return message;
  }

  if (attachments.length > 0) {
    return `${attachments.length} file${attachments.length > 1 ? "s" : ""} shared`;
  }

  return "";
};

export const broadcastMeetingUsers = async (io, meetingId) => {
  const meeting = await Meeting.findOne({ meetingId })
    .populate("hostId", "username avatar")
    .populate("participants", "username avatar")
    .lean();

  if (!meeting) {
    return;
  }

  const guestCount = meeting.guestParticipants?.length ?? 0;
  const userCount = meeting.participants?.length ?? 0;

  io.to(`meeting:${meetingId}`).emit("meeting-users-update", {
    meetingId,
    hostId: meeting.hostId._id.toString(),
    participants: meeting.participants,
    maxParticipants: MAX_MEETING_PARTICIPANTS,
    participantCount: userCount + guestCount,
  });
};

export const setupGroupMeetingListeners = (socket, io) => {
  socket.on("join-group", ({ groupId }) => {
    if (groupId) {
      socket.join(`group:${groupId}`);
    }
  });

  socket.on("leave-group", ({ groupId }) => {
    if (groupId) {
      socket.leave(`group:${groupId}`);
    }
  });

  socket.on("group-typing", ({ groupId, from, username }) => {
    if (!groupId || !from) {
      return;
    }

    socket.to(`group:${groupId}`).emit("group-typing", { groupId, from, username });
  });

  socket.on("group-message", async (data) => {
    const { groupId, message = "", attachments = [] } = data || {};
    const fromId = socket.userId;

    if (!fromId || !groupId) {
      return;
    }

    try {
      const group = await Group.findOne({ _id: groupId, members: fromId });

      if (!group) {
        socket.emit("group-message-error", { message: "Not a member of this group" });
        return;
      }

      if (!message.trim() && attachments.length === 0) {
        return;
      }

      const saved = await GroupMessage.create({
        group: groupId,
        from: fromId,
        message: message.trim(),
        attachments,
        status: "sent",
      });

      const populated = await GroupMessage.findById(saved._id)
        .populate("from", "username avatar")
        .lean();

      io.to(`group:${groupId}`).emit("group-message", populated);

      const memberIds = group.members.map((m) => m.toString()).filter((id) => id !== fromId);

      for (const uid of memberIds) {
        const sender = await User.findById(fromId).select("username");

        if (onlineUsers[uid]) {
          emitToUser(io, uid, "new_notification", {
            from: fromId,
            groupId,
            message: getNotificationText(message, attachments),
            username: sender?.username || "Someone",
            isGroup: true,
          });
        }
      }
    } catch {
      socket.emit("group-message-error", { message: "Failed to send group message" });
    }
  });

  socket.on("create-meeting", async ({ userId } = {}) => {
    const uid = socket.userId || userId;

    if (!uid) {
      return;
    }

    try {
      const meetingId = crypto.randomBytes(10).toString("hex");

      await Meeting.create({
        meetingId,
        hostId: uid,
        participants: [uid],
        guestParticipants: [],
        isActive: true,
      });

      socket.join(`meeting:${meetingId}`);
      socket.emit("meeting-created", { meetingId });
      await broadcastMeetingUsers(io, meetingId);
    } catch {
      socket.emit("meeting-error", { message: "Could not create meeting" });
    }
  });

  socket.on("join-meeting", async ({ meetingId, userId, guestId, isGuest } = {}) => {
    const uid = isGuest ? guestId : socket.userId || userId;

    if (!uid || !meetingId) {
      return;
    }

    try {
      const meeting = await Meeting.findOne({ meetingId, isActive: true });

      if (!meeting) {
        socket.emit("meeting-error", { message: "Meeting not found" });
        return;
      }

      if (!Array.isArray(meeting.guestParticipants)) {
        meeting.guestParticipants = [];
      }

      if (isGuest || String(uid).startsWith("guest_")) {
        const gid = String(guestId || uid);
        const found = meeting.guestParticipants.find((g) => g.guestId === gid);
        if (!found) {
          socket.emit("meeting-error", {
            message: "Use the join screen to enter this meeting as a guest.",
          });
          return;
        }

        socket.join(`meeting:${meetingId}`);
        await broadcastMeetingUsers(io, meetingId);
        return;
      }

      const idStr = String(uid);
      const total = meeting.participants.length + meeting.guestParticipants.length;

      if (!meeting.participants.map((p) => p.toString()).includes(idStr)) {
        if (total >= MAX_MEETING_PARTICIPANTS) {
          socket.emit("meeting-error", {
            message: `This room is full (maximum ${MAX_MEETING_PARTICIPANTS} participants including the host).`,
            code: "MEETING_FULL",
          });
          return;
        }

        meeting.participants.push(uid);
        await meeting.save();
      }

      socket.join(`meeting:${meetingId}`);
      await broadcastMeetingUsers(io, meetingId);
    } catch {
      socket.emit("meeting-error", { message: "Could not join meeting" });
    }
  });

  socket.on("leave-meeting", async ({ meetingId, userId, guestId, isGuest } = {}) => {
    const uid = isGuest ? guestId : socket.userId || userId;

    if (!uid || !meetingId) {
      return;
    }

    try {
      const meeting = await Meeting.findOne({ meetingId });

      if (!meeting) {
        return;
      }

      const idStr = String(uid);
      const isGuestLeave = Boolean(isGuest) || idStr.startsWith("guest_");

      if (isGuestLeave) {
        const gid = String(guestId || uid);
        meeting.guestParticipants = (meeting.guestParticipants || []).filter((g) => g.guestId !== gid);
      } else {
        meeting.participants = meeting.participants.filter((p) => p.toString() !== idStr);
      }

      const isHost = meeting.hostId.toString() === idStr;

      if (isHost || meeting.participants.length === 0) {
        meeting.isActive = false;
        meeting.participants = [];
        meeting.guestParticipants = [];
      }

      await meeting.save();
      socket.leave(`meeting:${meetingId}`);

      if (!meeting.isActive) {
        io.to(`meeting:${meetingId}`).emit("meeting-ended", { meetingId });
      } else {
        await broadcastMeetingUsers(io, meetingId);
      }
    } catch {
      socket.emit("meeting-error", { message: "Could not leave meeting" });
    }
  });

  socket.on("meeting-offer", (payload) => {
    const { to, meetingId, sdp } = payload || {};
    const from = socket.userId;

    if (!to || !from || !meetingId) {
      return;
    }

    emitToUser(io, to, "meeting-offer", { meetingId, from, sdp });
  });

  socket.on("meeting-answer", (payload) => {
    const { to, meetingId, sdp } = payload || {};
    const from = socket.userId;

    if (!to || !from || !meetingId) {
      return;
    }

    emitToUser(io, to, "meeting-answer", { meetingId, from, sdp });
  });

  socket.on("meeting-ice-candidate", (payload) => {
    const { to, meetingId, candidate } = payload || {};
    const from = socket.userId;

    if (!to || !from || !meetingId) {
      return;
    }

    emitToUser(io, to, "meeting-ice-candidate", { meetingId, from, candidate });
  });
};
