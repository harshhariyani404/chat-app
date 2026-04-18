import express from "express";
import { createMeeting, getMeeting, listMyMeetings } from "../controllers/meetingController.js";
import auth from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", auth, createMeeting);
router.get("/", auth, listMyMeetings);
router.get("/:meetingId", auth, getMeeting);

export default router;
