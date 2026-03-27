import Message from "../models/message.js";
import User from "../models/user.js";
import { onlineUsers } from "./onlineUsers.js";

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
    socket.on("register", async (userId) => {
      try {
        if (!userId) return;

        socket.userId = userId;
        onlineUsers[userId] = socket.id;
        socket.join(`user:${userId}`);

        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: null,
        });

        socket.broadcast.emit("user_online", userId);
      } catch {
        delete onlineUsers[userId];
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
      const { from, to, message, attachments = [] } = data;

      try {
        const savedMessage = await Message.create({
          from,
          to,
          message,
          attachments,
          status: "sent",
        });

        if (onlineUsers[to]) {
          await Message.findByIdAndUpdate(savedMessage._id, {
            status: "delivered",
          });
          savedMessage.status = "delivered";

          io.to(`user:${from}`).emit("message_status_update", {
            messageId: savedMessage._id,
            status: "delivered",
          });
        }

        const sender = await User.findById(from).select("username");

        io.to(`user:${to}`).emit("receive_message", savedMessage);
        io.to(`user:${to}`).emit("new_notification", {
          from,
          message: getNotificationText(message, attachments),
          username: sender?.username || "Unknown User",
        });

        io.to(`user:${from}`).emit("receive_message", savedMessage);
      } catch {
        io.to(`user:${from}`).emit("message_error", {
          message: "Unable to send message",
        });
      }
    });

    socket.on("disconnect", async () => {
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
      } catch {
        return;
      }
    });

    socket.on("message_seen", async ({ messageId }) => {
      try {
        const msg = await Message.findById(messageId);

        if (!msg) return;
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
      } catch {
        return;
      }
    });

    socket.on("call-user", ({ to, offer, from, callType }) => {
      const receiverSocket = onlineUsers[to];

      if (receiverSocket) {
        io.to(receiverSocket).emit("incoming-call", {
          from,
          offer,
          callType,
        });
      }
    });

    socket.on("answer-call", ({ to, answer }) => {
      const callerSocket = onlineUsers[to];

      if (callerSocket) {
        io.to(callerSocket).emit("call-answered", {
          answer,
        });
      }
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      const targetSocket = onlineUsers[to];

      if (targetSocket) {
        io.to(targetSocket).emit("ice-candidate", {
          candidate,
        });
      }
    });

    socket.on("call-ended", ({ to }) => {
      const targetSocket = onlineUsers[to];

      if (targetSocket) {
        io.to(targetSocket).emit("call-ended");
      }
    });

    socket.on("call-declined", ({ to }) => {
      const targetSocket = onlineUsers[to];

      if (targetSocket) {
        io.to(targetSocket).emit("call-declined");
      }
    });
  });
};

export default chatSocket;
