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
    // Ensure we are passing the ID string/ObjectId, not the whole user object
    const userId = req.user?._id || req.user?.id || req.user;

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