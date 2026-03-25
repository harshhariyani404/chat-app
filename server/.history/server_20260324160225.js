import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import chatSocket from "./sockets/chatSocket.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import messageRoute from "./routes/messageRoute.js";
import contactRoute from "./routes/contactRoute.js";


dotenv.config();

const app = express()
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/messages", messageRoute);
app.use("/uploads", express.static("uploads"));
app.use("/api/contacts", contactRoute);

connectDB()

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
    }
})

app.set("io", io);

chatSocket(io)

server.listen(5000, "0.0.0.0", () => {
    console.log("Server running on port 5000")
})
