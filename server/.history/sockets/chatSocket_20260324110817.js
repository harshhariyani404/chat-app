import Message from "../models/message.js";
import User from "../models/user.js";

const onlineUsers = {}; // { userId: socket.id }

const getNotificationText = (message, attachments = []) => {
  if (message?.trim()) {
    return message;
  }

  if (attachments.length > 0) {
    return `${attachments.length} file${attachments.length > 1 ? "s" : ""} shared`;
  }

  return "";
};

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register", async (userId) => {
      try {
        onlineUsers[userId] = socket.id;
        socket.join(`user:${userId}`);

        await User.findByIdAndUpdate(userId, {
          isOnline: true,
        });

        socket.broadcast.emit("user_online", userId);
        console.log("Online users:", onlineUsers);
      } catch (err) {
        console.log("Register error:", err);
      }
    });

    socket.on("typing", ({ from, to }) => {
      const receiverSocket = onlineUsers[to];

      if (receiverSocket) {
        io.to(receiverSocket).emit("typing", { from });
      }
    });

    socket.on("stopTyping", ({ from, to }) => {
      const receiverSocket = onlineUsers[to];

      if (receiverSocket) {
        io.to(receiverSocket).emit("stopTyping", { from });
      }
    });

    socket.on("send_message", async (data) => {
      try {
        const { from, to, message, attachments = [] } = data;

        const savedMessage = await Message.create({
          from,
          to,
          message,
          attachments,
          status: "sent",
        });

        const sender = await User.findById(from).select("username");

        io.to(`user:${to}`).emit("receive_message", savedMessage);
        io.to(`user:${to}`).emit("new_notification", {
          from,
          message: getNotificationText(message, attachments),
          username: sender?.username || "Unknown User",
        });

        io.to(`user:${from}`).emit("receive_message", savedMessage);
      } catch (err) {
        console.log("Error sending message:", err);
      }
    });

    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id);

      try {
        for (const userId in onlineUsers) {
          if (onlineUsers[userId] === socket.id) {
            const lastSeen = new Date();

            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastSeen,
            });

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
    socket.on("message_seen", async ({ messageId }) => {
      try {
        const msg = await Message.findById(messageId);

        if (!msg) return;

        // only receiver can mark seen
        if (msg.to.toString() !== socket.userId) return;

        const updated = await Message.findByIdAndUpdate(
          messageId,
          {
            status: "seen",
            seenAt: new Date(),
          },
          { new: true }
        );

        io.to(`user:${updated.from}`).emit("message_status_update", {
          messageId,
          status: "seen",
        });

      } catch (err) {
        console.log("Seen error:", err);
      }
    });
  });
};

export default chatSocket;
