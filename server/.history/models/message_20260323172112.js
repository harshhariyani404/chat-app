import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    message: {
        type: String,
        default: "",
        trim: true,
    },
    attachments: [
        {
            url: { type: String, required: true },
            publicId: { type: String, default: "" },
            originalName: { type: String, default: "" },
            mimeType: { type: String, default: "" },
            resourceType: { type: String, default: "raw" },
            format: { type: String, default: "" },
            bytes: { type: Number, default: 0 },
        }
    ],
    isEdited: {
        type: Boolean,
        default: false,
    },
    deletedFor: [{ type: String }],
    isDeletedForEveryone: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

export default Message;
