import express from "express";
import {saveNickname} from "../controllers/contactController.js"

const router = express.Router();

router.post("/nickname", saveNickname);

export default router;