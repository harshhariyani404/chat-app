import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },

    avatar: {
        type: String,
        default: ""
    },
    lastSeen: {
        type: Date,
        default: null
    },
    isOnline: {
        type: Boolean,
        default: false
    }

}, { timestamps: true })

export default mongoose.model("User", userSchema);