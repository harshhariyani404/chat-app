import mongoose from "mongoose";

const attachmentSchema = {
  url: { type: String, required: true },
  publicId: { type: String, default: "" },
  originalName: { type: String, default: "" },
  mimeType: { type: String, default: "" },
  resourceType: { type: String, default: "raw" },
  format: { type: String, default: "" },
  bytes: { type: Number, default: 0 },
};

const groupMessageSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    attachments: [attachmentSchema],
    status: {
      type: String,
      enum: ["sent", "delivered"],
      default: "sent",
    },
  },
  { timestamps: true }
);

const GroupMessage = mongoose.model("GroupMessage", groupMessageSchema);

export default GroupMessage;
