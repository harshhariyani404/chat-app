import express from "express";
import auth from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { getUsers, updateProfile, getUserStatus, getChatUsers, searchUsers } from "../controllers/userController.js";

const router = express.Router();

router.get("/", auth, getUsers);
router.get("/search", auth, searchUsers);
router.put("/profile", auth, upload.single("avatar"), updateProfile);
router.get("/status/:userId", auth, getUserStatus);
router.get("/chat-list/:myId", auth, getChatUsers);


export default router;
