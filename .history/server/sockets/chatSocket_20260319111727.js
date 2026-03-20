import Message from "../models/message";

const onlineUsers = {}

io.on("connection", (socket) => {
    socket.on("register", (userId) => {
        onlineUsers[userId] = socket.id;
    })

    socket.on("send_message",async (data) => {
        const { from, to, message} = data

        const saved = await Message.create({
            from,
            to,
            message,
        })

        const target = onlineUsers[to]
        if (target) {
            io.to(target).emit("receive_message", saved)
        }
        socket.emit("receive_message", saved)
    })
})