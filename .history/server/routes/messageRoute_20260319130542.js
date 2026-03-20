import express from "express";
import { getMessages } from "../controllers/messageController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:userId", auth, getMessages);

export default router;