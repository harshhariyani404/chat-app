import express from "express";
import {saveNickname} from "../controllers/contactController.js"
import auth from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/nickname", auth, saveNickname);

export default router;
