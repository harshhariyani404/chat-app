import express from "express";
import { getMessages, editMessage, deleteMessage } from "../controllers/messageController.js";
import auth from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/:userId", auth, getMessages);
router.put("/:messageId", auth, editMessage);
router.delete("/:messageId", auth, deleteMessage);

export default router;