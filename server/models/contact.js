import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  contactUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  nickname: {
    type: String,
    default: "",
  },
});

export default mongoose.model("Contact", contactSchema);