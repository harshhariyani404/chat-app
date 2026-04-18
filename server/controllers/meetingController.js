import crypto from "crypto";
import { MAX_MEETING_PARTICIPANTS } from "../config/meetingConfig.js";
import Meeting from "../models/meeting.js";
import { ApiError, handleControllerError } from "../utils/http.js";

const withMeetingMeta = (meeting) => ({
  ...meeting,
  maxParticipants: MAX_MEETING_PARTICIPANTS,
  participantCount: meeting.participants?.length ?? 0,
});

const makeMeetingId = () => crypto.randomBytes(10).toString("hex");

export const createMeeting = async (req, res) => {
  try {
    const hostId = req.userId;

    const meetingId = makeMeetingId();

    const meeting = await Meeting.create({
      meetingId,
      hostId,
      participants: [hostId],
      isActive: true,
    });

    const populated = await Meeting.findById(meeting._id)
      .populate("hostId", "username avatar")
      .populate("participants", "username avatar")
      .lean();

    res.status(201).json(withMeetingMeta(populated));
  } catch (error) {
    handleControllerError(res, error, "Error creating meeting");
  }
};

export const getMeeting = async (req, res) => {
  try {
    const userId = req.userId;
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
