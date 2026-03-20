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
        const newUser = await user.create({username, password: hashed})
        res.status(201).json({ message: "User created successfully" });
    }catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const login = async (req, res) => {
    try {
        const { username, password } = req.body

        const existingUser = await user.findOne({ username });
        if (!existingUser) {
            return res.status(400).json({ message: "User does not exist" });
        }
        
        const isMatch = await bcrypt.compare(password, existingUser.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign({ id: existingUser._id }, JWT_SECRET);
        res.status(200).json({ token, user: existingUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}