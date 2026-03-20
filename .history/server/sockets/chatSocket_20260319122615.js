import Message from "../models/message.js";

const onlineUsers = {}; // { userId: socket.id }

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // ✅ Register user (map userId -> socket.id)
    socket.on("register", (userId) => {
      onlineUsers[userId] = socket.id;
      console.log("Online users:", onlineUsers);
    });

    // ✅ Send private message
    socket.on("send_message", async (data) => {
      try {
        const { from, to, message } = data;

        // Save message in DB
        const savedMessage = await Message.create({
          from,
          to,
          message,
        });

        // Send to receiver
        const receiverSocket = onlineUsers[to];
        if (receiverSocket) {
          io.to(receiverSocket).emit("receive_message", savedMessage);
        }

        // Send back to sender (so UI updates instantly)
        socket.emit("receive_message", savedMessage);

      } catch (err) {
        console.log("Error sending message:", err);
      }
    });

    // ✅ Handle disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      // Remove user from online list
      for (let userId in onlineUsers) {
        if (onlineUsers[userId] === socket.id) {
          delete onlineUsers[userId];
          break;
        }
      }

      console.log("Updated users:", onlineUsers);
    });
  });
};

export default chatSocket;