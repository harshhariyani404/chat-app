import express from "express";
import auth from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { getUsers } from "../controllers/userController.js";

const router = express.Router();

router.get("/", getUsers);

export default router;