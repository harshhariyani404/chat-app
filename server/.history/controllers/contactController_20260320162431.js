import Contact from "../models/Contact.js";

export const saveNickname = async (req, res) => {
  try {
    const { userId, contactUserId, nickname } = req.body;

    let contact = await Contact.findOne({
      user: userId,
      contactUser: contactUserId,
    });

    if (contact) {
      contact.nickname = nickname;
    } else {
      contact = new Contact({
        user: userId,
        contactUser: contactUserId,
        nickname,
      });
    }

    await contact.save();

    res.json(contact);
  } catch (err) {
    res.status(500).json({ message: "Error saving nickname" });
  }
};