export const getUsers = async (req, res) => {
  const myId = req.query.myId;

  const users = await User.find({
    _id: { $ne: myId }, // exclude me
  }).select("-password");

  res.json(users);
};