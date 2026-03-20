import { useEffect, useState, useRef } from "react";
import { socket } from "../socket";
import Message from "./Message";

const Chat = () => {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const bottomRef = useRef();

  useEffect(() => {
    socket.on("chat_history", (data) => {
      setMessageList(data);
    });

    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    return () => {
      socket.off("chat_history");
      socket.off("receive_message");
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  const sendMessage = () => {
    if (!message || !username) return;

    socket.emit("send_message", {
      user: username,
      message,
    });

    setMessage("");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl flex flex-col">
        
        {/* Header */}
        <div className="bg-blue-500 text-white p-4 rounded-t-xl font-bold text-lg">
          💬 Chat App
        </div>

        {/* Username Input */}
        <div className="p-3 border-b">
          <input
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter username"
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        {/* Messages */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-gray-50">
          {messageList.map((msg, index) => (
            <Message key={index} msg={msg} username={username} />
          ))}
          <div ref={bottomRef}></div>
        </div>

        {/* Input */}
        <div className="p-3 flex gap-2 border-t">
          <input
            className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Type message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>

      </div>
    </div>
  );
};

export default Chat;