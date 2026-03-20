import express from "express";
import auth from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { getUsers, updateProfile } from "../controllers/userController.js";

const router = express.Router();

router.get("/", getUsers);
router.put("/", auth, upload.single("avatar"), updateProfile);

export default router;