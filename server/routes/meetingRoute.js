import express from "express";
import {
  createMeeting,
  getMeeting,
  getMeetingPublic,
  joinGuestMeeting,
  listMyMeetings,
} from "../controllers/meetingController.js";
import auth from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/public/:meetingId/join", joinGuestMeeting);
router.get("/public/:meetingId", getMeetingPublic);

router.post("/", auth, createMeeting);
router.get("/", auth, listMyMeetings);
router.get("/:meetingId", auth, getMeeting);

export default router;
