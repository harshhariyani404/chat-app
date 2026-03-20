import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

import connectDB from "../config/db.js";
import chatSocket from "../sockets/chatSocket.js";

const app = express()
app.use(cors());

connectDB()

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
    }
})

chatSocket(io)

server.listen(5000, () => {
    console.log("Server running on port 5000")
})