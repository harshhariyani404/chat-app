import express from "express";
import {
  addMembers,
  createGroup,
  deleteGroup,
  getGroup,
  getGroupMessages,
  listMyGroups,
  removeMember,
} from "../controllers/groupController.js";
import auth from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", auth, createGroup);
router.get("/", auth, listMyGroups);
router.get("/:groupId/messages", auth, getGroupMessages);
router.post("/:groupId/members", auth, addMembers);
router.delete("/:groupId/members/:memberId", auth, removeMember);
router.get("/:groupId", auth, getGroup);
router.delete("/:groupId", auth, deleteGroup);

export default router;
