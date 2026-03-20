import Message from "../models/message.js";
import User from "../models/user.js";

const onlineUsers = {}; // { userId: socket.id }

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // ✅ Register user (ONLINE)
    socket.on("register", async (userId) => {
      try {
        onlineUsers[userId] = socket.id;

        // 🔥 Mark user online
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
        });

        // 🔥 Notify all other users
        socket.broadcast.emit("user_online", userId);

        console.log("Online users:", onlineUsers);
      } catch (err) {
        console.log("Register error:", err);
      }
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

        // Get sender info
        const sender = await User.findById(from);

        // Send to receiver (if online)
        const receiverSocket = onlineUsers[to];
        if (receiverSocket) {
          io.to(receiverSocket).emit("receive_message", savedMessage);

          io.to(receiverSocket).emit("new_notification", {
            from,
            message,
            username: sender?.username || "Unknown User",
          });
        }

        // Send back to sender
        socket.emit("receive_message", savedMessage);

      } catch (err) {
        console.log("Error sending message:", err);
      }
    });

    // ✏️ Edit message
    socket.on("edit_message", async ({ messageId, newText }) => {
      const updated = await Message.findByIdAndUpdate(
        messageId,
        { message: newText, isEdited: true },
        { new: true }
      );

      io.emit("message_edited", updated);
    });

    // 🗑️ Delete message
    socket.on("delete_message", async (messageId) => {
      await Message.findByIdAndDelete(messageId);
      io.emit("message_deleted", messageId);
    });

    // ❌ Handle disconnect (LAST SEEN)
    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id);

      try {
        for (let userId in onlineUsers) {
          if (onlineUsers[userId] === socket.id) {
            
            const lastSeen = new Date();

            // 🔥 Update DB
            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastSeen: lastSeen,
            });

            // 🔥 Notify all users
            socket.broadcast.emit("user_offline", {
              userId,
              lastSeen,
            });

            delete onlineUsers[userId];
            break;
          }
        }

        console.log("Updated users:", onlineUsers);

      } catch (err) {
        console.log("Disconnect error:", err);
      }
    });

  });
};

export default chatSocket;