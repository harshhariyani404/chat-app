import express from "express";
import { getMessages, editMessage, deleteMessage, uploadMessageFiles, deleteForMe } from "../controllers/messageController.js";
import auth from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/:userId", auth, getMessages);
router.post("/:userId/files", auth, upload.array("files", 10), uploadMessageFiles);
router.put("/:messageId", auth, editMessage);
router.delete("/:messageId", auth, deleteMessage);
router.delete("/:messageId/for-me", auth, deleteForMe);

export default router;
