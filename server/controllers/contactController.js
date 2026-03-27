import Contact from "../models/contact.js";
import { ApiError, handleControllerError } from "../utils/http.js";
import { validateObjectId } from "../utils/validation.js";

export const saveNickname = async (req, res) => {
  try {
    const userId = req.userId;
    const contactUserId = req.body.contactUserId;
    const nickname = req.body.nickname?.trim();

    if (!validateObjectId(contactUserId)) {
      throw new ApiError(400, "A valid contact user id is required");
    }

    if (!nickname) {
      throw new ApiError(400, "Nickname is required");
    }

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
  } catch (error) {
    handleControllerError(res, error, "Error saving nickname");
  }
};
