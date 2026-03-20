import express from "express";
import auth from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { getUsers, updateProfile, getUserStatus } from "../controllers/userController.js";

const router = express.Router();

router.get("/", getUsers);
router.put("/profile", auth, upload.single("avatar"), updateProfile);
router.get("/status/:userId", getUserStatus);


export default router;