import express from "express";
import { getMessages, editMessage, deleteMessage , getUserStatus} from "../controllers/messageController.js";
import auth from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/:userId", auth, getMessages);
router.put("/:messageId", auth, editMessage);
router.delete("/:messageId", auth, deleteMessage);
router.get("/status/:userId", auth, getUserStatus);

export default router;