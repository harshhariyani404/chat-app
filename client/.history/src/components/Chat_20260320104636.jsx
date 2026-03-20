import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { socket } from "../socket";
import Message from "./Message";

const Chat = ({ user, selected }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const inputRef = useRef(null)
  const bottomRef = useRef(null)

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!selected) return;

    setMessages([]); // clear old chat

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

  useEffect(() => {
    socket.on("message_edited", (updatedMsg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))
      );
    });

    socket.on("message_deleted", (id) => {
      setMessages((prev) => prev.filter((m) => m._id !== id));
    });

    return () => {
      socket.off("message_edited");
      socket.off("message_deleted");
    };
  }, []);

  useEffect(() => {
    inputRef.current?.focus()
  }, [selected])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  })

  const sendMessage = () => {
    if (!text.trim()) return; // Don't send empty messages

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
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 mt-4">
        <textarea
          ref={inputRef}
          className="flex-1 border border-gray-300 p-2 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={text}
          rows="2"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        ></textarea>

        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded transition-colors" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;