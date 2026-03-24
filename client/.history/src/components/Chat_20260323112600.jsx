import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { socket } from "../socket";
import Message from "./Message";

const Chat = ({ user, selected, setSelected, setUsers, fetchUsers }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [newName, setNewName] = useState("");
  const [showEdit, setShowEdit] = useState(false);

  const inputRef = useRef(null);

  const token = localStorage.getItem("token");

  // 🔁 Load messages
  useEffect(() => {
    if (!selected) return;

    setMessages([]);

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/messages/${selected._id}`,
          { headers: { Authorization: token } }
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

  // ✏️ Edit / Delete message
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

  // 🔽 Auto focus
  useEffect(() => {
    inputRef.current?.focus();
  }, [selected]);


  // 📤 Send message
  const sendMessage = () => {
  if (!text.trim()) return;

  socket.emit("send_message", {
    from: user._id,
    to: selected._id,
    message: text,
  });

  // 🔥 add user to sidebar instantly
  setUsers((prev) => {
    const exists = prev.find((u) => u._id === selected._id);
    if (exists) return prev;
    return [...prev, selected];
  });

  setText("");
};

  // ✏️ Update nickname
  const updateNickname = async () => {
    if (!newName.trim()) return;

    try {
      await axios.post("http://localhost:5000/api/contacts/nickname", {
        userId: user._id,
        contactUserId: selected._id,
        nickname: newName,
      });

      // ⚡ instant UI
      setSelected((prev) => ({
        ...prev,
        displayName: newName,
      }));

      setUsers((prev) => {
        const exists = prev.find((u) => u._id === selected._id);

        if (exists) {
          return prev.map((u) =>
            u._id === selected._id ? { ...u, displayName: newName } : u
          );
        }

        return [...prev, { ...selected, displayName: newName }];
      });

      await fetchUsers(); // sync

      setShowEdit(false);
      setNewName("");
    } catch (err) {
      console.log("Error updating nickname", err);
    }
  };

  // 🕒 Format last seen
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

      {/* 🔥 HEADER */}
      <div className="mb-2 flex gap-4 items-center">
        <img
          src={
            selected?.avatar
              ? selected.avatar.startsWith("http")
                ? selected.avatar
                : `http://localhost:5000${selected.avatar}`
              : `https://api.dicebear.com/7.x/initials/svg?seed=${selected?.username}`
          }
          className="w-10 h-10 rounded-full object-cover"
        />

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="font-bold">
              {selected.displayName || selected.username}
            </h2>

            <button
              onClick={() => {
                setShowEdit(!showEdit);
                setNewName(selected.displayName || selected.username);
              }}
              className="text-blue-500 text-sm"
            >
              ✏️
            </button>
          </div>

          {selected.isOnline ? (
            <p className="text-green-500 text-sm">Online</p>
          ) : (
            <p className="text-gray-400 text-sm">
              Last seen {formatTime(selected.lastSeen)}
            </p>
          )}

          {showEdit && (
            <div className="flex gap-2 mt-1">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="border p-1 rounded text-sm"
              />
              <button
                onClick={updateNickname}
                className="bg-blue-500 text-white px-2 rounded text-sm"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 💬 MESSAGES */}
      <div className="flex-1 overflow-y-auto flex flex-col-reverse">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          [...messages].reverse().map((m, i) => (
            <Message key={i} msg={m} myId={user._id} />
          ))
        )}
      </div>

      {/* 📩 INPUT */}
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

        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;