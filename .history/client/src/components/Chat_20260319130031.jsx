import { useEffect, useState } from "react";
import axios from "axios";
import { socket } from "../socket";
import Message from "./Message";

const Chat = ({ user, selected }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    setMessages([]); // clear old chat

    useEffect(() => {
    if (!selected) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/messages/${selected._id}`,
          {
            headers: { Authorization: token },
          }
        );

        setMessages(res.data);
      } catch (err) {
        console.log("Error loading messages:", err);
      }
    };

    fetchMessages();
  }, [selected]);

    fetchMessages();

    const handleReceiveMessage = (data) => {
      // Only add if message belongs to current chat
      if (
        (data.from === user._id && data.to === selected._id) ||
        (data.from === selected._id && data.to === user._id)
      ) {
        setMessages((prev) => [...prev, data]);
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => socket.off("receive_message", handleReceiveMessage);
  }, [selected, user._id, token]);

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