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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return; // Don't send empty messages

    socket.emit("send_message", {
      from: user._id,
      to: selected._id,
      message: text,
    });

    setText("");
  };

  const formatTime = (time) => {
    if (!time) return "";

    const diff = Date.now() - new Date(time);

    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours} hr ago`;

    return new Date(time).toLocaleString();
  };

  return (
    <div className="flex-1 p-4 flex flex-col">
      <div className=" flex gap-4 bg-slate-400">
         <img
                src={
                  selected?.avatar
                    ? (selected.avatar.startsWith('http') ? selected.avatar : `http://localhost:5000${selected.avatar}`)
                    : `https://api.dicebear.com/7.x/initials/svg?seed=${selected?.username || 'default'}`
                }
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
        <h2 className="font-bold">{selected.username}</h2>

        {selected.isOnline ? (
          <p className="text-green-500 text-sm">Online</p>
        ) : (
          <p className="text-gray-400 text-sm">
            Last seen {formatTime(selected.lastSeen)}
          </p>
        )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((m, i) => (
            <Message key={i} msg={m} myId={user._id} />
          ))
        )}
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
