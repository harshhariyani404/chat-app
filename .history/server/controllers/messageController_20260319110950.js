import Message from "../models/message.js";

export const getMessages = async (req, res) => {
    const { userId } = req.params;
    const myId = req.user

    const messages = await Message.find({
        $or: [
            { from: myId, to: userId },
            { from: userId, to: myId },
        ],
        })
        .sort({ createdAt: 1 })
        
        res.json(messages);
}