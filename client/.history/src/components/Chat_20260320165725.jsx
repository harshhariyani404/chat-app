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
  const bottomRef = useRef(null);

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

    socket.on("receive_message", (data) => {
      if (
        (data.from === user._id && data.to === selected._id) ||
        (data.from === selected._id && data.to === user._id)
      ) {
        setMessages((prev) => [...prev, data]);
      }
    });

    return () => socket.off("receive_message");
  }, [selected]);

  // 🔽 Scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 📤 Send
  const sendMessage = () => {
    if (!text.trim()) return;

    socket.emit("send_message", {
      from: user._id,
      to: selected._id,
      message: text,
    });

    setText("");
  };

  // ✏️ Nickname update
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

      setUsers((prev) =>
        prev.map((u) =>
          u._id === selected._id
            ? { ...u, displayName: newName }
            : u
        )
      );

      // 🔄 sync with backend
      await fetchUsers();

      setShowEdit(false);
      setNewName("");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex-1 p-4 flex flex-col">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-2">
        <img
          src={
            selected?.avatar
              ? `http://localhost:5000${selected.avatar}`
              : `https://api.dicebear.com/7.x/initials/svg?seed=${selected?.username}`
          }
          className="w-10 h-10 rounded-full"
        />

        <div>
          <div className="flex gap-2 items-center">
            <h2 className="font-bold">
              {selected.displayName || selected.username}
            </h2>

            <button onClick={() => setShowEdit(!showEdit)}>✏️</button>
          </div>

          {showEdit && (
            <div className="flex gap-2 mt-1">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="border p-1"
              />
              <button onClick={updateNickname}>Save</button>
            </div>
          )}
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto">
        {messages.map((m, i) => (
          <Message key={i} msg={m} myId={user._id} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="flex gap-2 mt-3">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border p-2"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;