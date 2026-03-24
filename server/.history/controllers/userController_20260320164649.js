import User from "../models/user.js";
import Message from "../models/message.js";
import contact from "../models/contact.js";


export const getUsers = async (req, res) => {
  try {
    const myId = req.query.myId;

    const users = await User.find({
      _id: { $ne: myId }, // exclude me
    }).select("-password");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;

    let updateData = {};

    if (req.file) {
      updateData.avatar = `/uploads/${req.file.filename}`;
    }

    if (req.body.username) {
      updateData.username = req.body.username;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ msg: "Error updating profile" });
  }
};

export const getUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const foundUser = await User.findById(userId).select("isOnline lastSeen");

    res.json(foundUser);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user status" });
  }
};



export const getChatUsers = async (req, res) => {
  try {
    const { myId } = req.params;

    const messages = await Message.find({
      $or: [{ from: myId }, { to: myId }],
    });

    const userIds = new Set();

    messages.forEach((msg) => {
      if (msg.from.toString() !== myId)
        userIds.add(msg.from.toString());

      if (msg.to.toString() !== myId)
        userIds.add(msg.to.toString());
    });

    const users = await User.find({
      _id: { $in: Array.from(userIds) },
    });

    const contacts = await contact.find({ user: myId });

    const result = users.map((u) => {
      const contact = contacts.find(
        (c) =>
          c.contactUser.toString() === u._id.toString()
      );

      return {
        ...u._doc,
        displayName: contact?.nickname || u.username, // 🔥 IMPORTANT
      };
    });

    res.json(result);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching chat users" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.json([]);
    }
    const users = await User.find({
      username: { $regex: query, $options: "i" },
    }).select("-password");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error searching users", error: error.message });
  }
};