import express from "express";
import auth from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { getUsers, updateProfile, getUserStatus, getChatUsers, searchUsers } from "../controllers/userController.js";

const router = express.Router();

router.get("/", getUsers);
router.get("/search", searchUsers);
router.put("/profile", auth, upload.single("avatar"), updateProfile);
router.get("/status/:userId", getUserStatus);
router.get("/chat-list/:myId", getChatUsers);


export default router;
