import Message from "../models/message";

const chatSocket = (io) => {
    io.on("connection", async (socket) => {
        console.log("User connected:" , socket.id)

        const messages = await Message.find().sort({createdAt: 1}).limit(50);
        socket.emit("chat_history", messages);

        socket.on("send_message", async (data) => {
            const savedMessage = await Message.create(data);
            io.emit("receive_message", savedMessage);
        })

        socket.on("disconnect", () => {
            console.log("user disconnected")
        })
    })
}

export default chatSocket;