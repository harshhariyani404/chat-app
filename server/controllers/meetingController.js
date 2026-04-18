import crypto from "crypto";
import { MAX_MEETING_PARTICIPANTS } from "../config/meetingConfig.js";
import Meeting from "../models/meeting.js";
import { ApiError, handleControllerError } from "../utils/http.js";

const makeMeetingId = () => crypto.randomBytes(10).toString("hex");

const loadMeetingPayload = async (meetingDocOrId) => {
  const id = typeof meetingDocOrId === "object" && meetingDocOrId?._id ? meetingDocOrId._id : meetingDocOrId;
  const populated = await Meeting.findById(id)
    .populate("hostId", "username avatar")
    .populate("participants", "username avatar")
    .lean();

  return populated;
};

const withMeetingMeta = (meeting) => {
  if (!meeting) return meeting;
  const guests = meeting.guestParticipants?.length ?? 0;
  const users = meeting.participants?.length ?? 0;
  return {
    ...meeting,
    maxParticipants: MAX_MEETING_PARTICIPANTS,
    participantCount: users + guests,
  };
};

export const createMeeting = async (req, res) => {
  try {
    const hostId = req.userId;

    const meetingId = makeMeetingId();

    const meeting = await Meeting.create({
      meetingId,
      hostId,
      participants: [hostId],
      guestParticipants: [],
      isActive: true,
    });

    const populated = await loadMeetingPayload(meeting._id);

    res.status(201).json(withMeetingMeta(populated));
  } catch (error) {
    handleControllerError(res, error, "Error creating meeting");
  }
};

export const getMeetingPublic = async (req, res) => {
  try {
    const { meetingId } = req.params;

    if (!meetingId?.trim()) {
      throw new ApiError(400, "Invalid meeting id");
    }

    const meeting = await Meeting.findOne({ meetingId: meetingId.trim() })
      .populate("hostId", "username avatar")
      .populate("participants", "username avatar")
      .lean();

    if (!meeting || !meeting.isActive) {
      throw new ApiError(404, "Meeting not found");
    }

    res.json(withMeetingMeta(meeting));
  } catch (error) {
    handleControllerError(res, error, "Error fetching meeting");
  }
};

export const joinGuestMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const rawName = req.body?.displayName ?? "";
    const name = String(rawName).trim().slice(0, 40);
    const { existingGuestId } = req.body || {};

    if (!meetingId?.trim()) {
      throw new ApiError(400, "Invalid meeting id");
    }

    const meeting = await Meeting.findOne({ meetingId: meetingId.trim(), isActive: true });

    if (!meeting) {
      throw new ApiError(404, "Meeting not found");
    }

    if (!Array.isArray(meeting.guestParticipants)) {
      meeting.guestParticipants = [];
    }

    if (existingGuestId && String(existingGuestId).startsWith("guest_")) {
      const existing = meeting.guestParticipants.find((g) => g.guestId === existingGuestId);
      if (existing) {
        const populated = await loadMeetingPayload(meeting._id);
        return res.json({
          guestId: existing.guestId,
          displayName: existing.displayName,
          meeting: withMeetingMeta(populated),
        });
      }
    }

    if (name.length < 1) {
      throw new ApiError(400, "Enter a display name");
    }

    const total = meeting.participants.length + meeting.guestParticipants.length;
    if (total >= MAX_MEETING_PARTICIPANTS) {
      throw new ApiError(403, "Meeting is full");
    }

    const guestId = `guest_${crypto.randomUUID()}`;
    meeting.guestParticipants.push({ guestId, displayName: name });
    await meeting.save();

    const populated = await loadMeetingPayload(meeting._id);

    res.status(201).json({
      guestId,
      displayName: name,
      meeting: withMeetingMeta(populated),
    });
  } catch (error) {
    handleControllerError(res, error, "Error joining as guest");
  }
};

export const getMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    if (!meetingId?.trim()) {
      throw new ApiError(400, "Invalid meeting id");
    }

    const meeting = await Meeting.findOne({ meetingId: meetingId.trim() })
      .populate("hostId", "username avatar")
      .populate("participants", "username avatar")
      .lean();

    if (!meeting || !meeting.isActive) {
      throw new ApiError(404, "Meeting not found");
    }

    res.json(withMeetingMeta(meeting));
  } catch (error) {
    handleControllerError(res, error, "Error fetching meeting");
  }
};

export const listMyMeetings = async (req, res) => {
  try {
    const userId = req.userId;

    const meetings = await Meeting.find({
      isActive: true,
      $or: [{ hostId: userId }, { participants: userId }],
    })
      .populate("hostId", "username avatar")
      .populate("participants", "username avatar")
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    res.json(meetings.map((m) => withMeetingMeta(m)));
  } catch (error) {
    handleControllerError(res, error, "Error listing meetings");
  }
};
