import express from "express";
import {
  addMembers,
  createGroup,
  deleteGroup,
  getGroup,
  getGroupMessages,
  listMyGroups,
  patchGroup,
  removeMember,
  uploadGroupMessageFiles,
} from "../controllers/groupController.js";
import auth from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/", auth, createGroup);
router.get("/", auth, listMyGroups);
router.post("/:groupId/messages/files", auth, upload.array("files", 10), uploadGroupMessageFiles);
router.get("/:groupId/messages", auth, getGroupMessages);
router.post("/:groupId/members", auth, addMembers);
router.delete("/:groupId/members/:memberId", auth, removeMember);
router.patch("/:groupId", auth, upload.single("avatar"), patchGroup);
router.get("/:groupId", auth, getGroup);
router.delete("/:groupId", auth, deleteGroup);

export default router;
