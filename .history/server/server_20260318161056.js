const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

// MongoDB connect
mongoose.connect("mongodb://127.0.0.1:27017/chatApp")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Schema
const Message = mongoose.model("Message", {
  user: String,
  message: String,
  time: String,
});

// Socket
io.on("connection", async (socket) => {
  console.log("User connected:", socket.id);

  // Send history
  const messages = await Message.find().limit(50);
  socket.emit("chat_history", messages);

  socket.on("send_message", async (data) => {
    const newMsg = new Message(data);
    await newMsg.save();

    io.emit("receive_message", data);
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});