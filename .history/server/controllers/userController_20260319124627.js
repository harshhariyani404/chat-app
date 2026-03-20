import user from "../models/user.js";

export const getUsers = async (req, res) => {
  try {
    const users = await user.find().select("-password"); // hide password
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching users" });
  }
};