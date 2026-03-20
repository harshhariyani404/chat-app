import Message from "../models/message.js";

export const getMessages = async (req, res) => {
  try {
    const myId = req.user; // from JWT
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { from: myId, to: otherUserId },
        { from: otherUserId, to: myId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error fetching messages" });
  }
};