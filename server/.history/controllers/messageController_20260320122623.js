import Message from "../models/message.js";

export const getMessages = async (req, res) => {
  try {
    const myId = req.userId; // from JWT
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

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { newText } = req.body;
    
    const updated = await Message.findByIdAndUpdate(
      messageId,
      { message: newText, isEdited: true },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error editing message" });
  }
}

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } =  req.params;
    const deleted = await Message.findByIdAndDelete(messageId);
    res.json(deleted);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error deleting message" });
  }
}