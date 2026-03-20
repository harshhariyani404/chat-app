import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { socket } from "../socket";
import Message from "./Message";

const Chat = ({ user, selected, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  const token = localStorage.getItem("token");
  const avatar = selected?.avatar
    ? selected.avatar.startsWith("http")
      ? selected.avatar
      : `http://localhost:5000${selected.avatar}`
    : `https://api.dicebear.com/7.x/initials/svg?seed=${selected?.username || "default"}`;

  useEffect(() => {
    if (!selected) return;

    setMessages([]);

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
        prev.map((message) => (message._id === updatedMsg._id ? updatedMsg : message))
      );
    });

    socket.on("message_deleted", (id) => {
      setMessages((prev) => prev.filter((message) => message._id !== id));
    });

    return () => {
      socket.off("message_edited");
      socket.off("message_deleted");
    };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;

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
    <section className="chat-panel">
      <header className="border-b border-slate-700/10 px-4 py-4 sm:px-6">
        <div className="soft-panel flex items-center gap-3 rounded-[28px] px-4 py-3">
          <button
            type="button"
            onClick={onBack}
            className="secondary-button px-3 md:hidden"
          >
            Back
          </button>

          <img
            src={avatar}
            alt={selected.username}
            className="h-12 w-12 rounded-2xl object-cover"
          />

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold sm:text-xl">
              {selected.username}
            </h2>

            {selected.isOnline ? (
              <p className="text-sm text-[#2f8f83]">Online now</p>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-soft)" }}>
                Last seen {formatTime(selected.lastSeen)}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4 sm:px-6">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-md rounded-[30px] border border-white/60 bg-white/70 px-8 py-10 text-center shadow-[0_20px_50px_rgba(20,44,58,0.08)] backdrop-blur-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-[#2f8f83] text-xl font-semibold text-white">
                Hi
              </div>
              <h3 className="text-xl font-semibold">No messages yet</h3>
              <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-soft)" }}>
                Start the conversation with something simple. Your first message
                will appear here with the new polished chat styling.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message) => (
              <Message key={message._id || `${message.from}-${message.to}-${message.message}`} msg={message} myId={user._id} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-700/10 px-3 py-4 sm:px-6">
        <div className="soft-panel flex items-end gap-3 rounded-[28px] p-3">
          <textarea
            ref={inputRef}
            className="min-h-[56px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none sm:text-[15px]"
            value={text}
            rows="1"
            placeholder={`Message ${selected.username}...`}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          <button className="primary-button px-5 py-3" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </section>
  );
};

export default Chat;
