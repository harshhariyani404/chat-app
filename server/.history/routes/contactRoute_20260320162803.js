import express from "express";
import {contactController} from "./controllers/contactController.js"

const router = express.Router();

router.post("/nickname", contactController.saveNickname);

export default router;