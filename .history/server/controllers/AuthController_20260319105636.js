import user from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import user from "../models/user.js";

const JWT_SECRET = "secret";

export const signup = async (req, res) => {
    try {
        const { username, password } = req.body;
        const userExists = await user.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashed = await bcrypt.hash(password, 10);
        const user = await user.create({username, password: hashed})

        res.status(201).json({ message: "User created successfully" });


    }catch (error) {
        res.status(500).json({ error: error.message });
    }
}
