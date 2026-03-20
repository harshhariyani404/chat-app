import User from "../models/user.js";

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
    const userId = req.user;

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

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Error updating profile" });
  }
};