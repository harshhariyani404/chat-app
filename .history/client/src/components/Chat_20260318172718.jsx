import { useEffect, useState } from 'react';
import { socket } from "../socket";
import Message from './Message';

const Chat = () => {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

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

  const sendMessage = () => {
    if (!message || !username) return;

    socket.emit("send_message", {
      user: username,
      message,
    });

    setMessage("");
  };

  return (
    <div className="max-w-[500px] mx-auto p-4 bg-gray-200 rounded-lg">
      <h2 className="text-xl font-bold mb-2">Chat App 💬</h2>

      <input
        className="border p-2 w-full mb-2"
        placeholder="Username"
        onChange={(e) => setUsername(e.target.value)}
      />

      <div className="h-[300px] overflow-y-scroll bg-white p-2 mb-2 rounded">
        {messageList.map((msg, index) => (
          <Message key={index} msg={msg} />
        ))}
      </div>

      <input
        className="border p-2 w-full mb-2"
        placeholder="Type message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        className="bg-blue-500 text-white px-4 py-2 rounded w-full"
        onClick={sendMessage}
      >
        Send
      </button>
    </div>
  );
};

export default Chat;