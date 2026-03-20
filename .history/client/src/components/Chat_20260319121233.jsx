import { useEffect, useState } from "react";
import axios from "axios";
import { socket } from "../socket";
import Message from "./Message";

const Chat = ({ user, selected }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await axios.get(
        `http://localhost:5000/api/messages/${selected._id}`,
        { headers: { Authorization: token } }
      );
      setMessages(res.data);
    };

    fetchMessages();

    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => socket.off("receive_message");
  }, [selected]);

  const sendMessage = () => {
    socket.emit("send_message", {
      from: user._id,
      to: selected._id,
      message: text,
    });

    setText("");
  };

  return (
    <div className="flex-1 p-4 flex flex-col">
      <h2 className="font-bold mb-2">{selected.username}</h2>

      <div className="flex-1 overflow-y-auto">
        {messages.map((m, i) => (
          <Message key={i} msg={m} myId={user._id} />
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="border p-2 flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;