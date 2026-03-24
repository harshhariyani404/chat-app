import { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { socket } from "../socket";
import Message from "./Message";
import EmojiPicker from "emoji-picker-react";

const API_BASE_URL = "http://localhost:5000";

const fileTypeOptions = [
  { id: "images", label: "Images", accept: "image/*" },
  { id: "videos", label: "Videos", accept: "video/*" },
  {
    id: "documents",
    label: "Documents",
    accept: ".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx",
  },
  { id: "all", label: "Any file", accept: "*/*" },
];

const Chat = ({ user, selected, setUsers }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showFileTypeMenu, setShowFileTypeMenu] = useState(false);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const fileMenuRef = useRef(null);

  const token = localStorage.getItem("token");

  // 🔁 Fetch messages
  useEffect(() => {
    if (!selected) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/messages/${selected._id}`,
          { headers: { Authorization: token } }
        );
        setMessages(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchMessages();

    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => socket.off("receive_message");
  }, [selected]);

  // 😊 Emoji
  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  // 📤 Send text
  const sendMessage = () => {
    if (!text.trim()) return;

    socket.emit("send_message", {
      from: user._id,
      to: selected._id,
      message: text,
    });

    setText("");
  };

  // 📁 Select file
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  // ❌ Remove file
  const removeFile = (index) => {
    setSelectedFiles((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // 📂 Open picker (IMPORTANT 🔥)
  const openFilePicker = (accept) => {
    setShowFileTypeMenu(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  // 📤 Send files
  const sendFiles = async () => {
    if (!selectedFiles.length) return;

    try {
      setIsUploadingFiles(true);

      const formData = new FormData();
      selectedFiles.forEach((file) =>
        formData.append("files", file)
      );

      await axios.post(
        `${API_BASE_URL}/api/messages/${selected._id}/files`,
        formData,
        {
          headers: {
            Authorization: token,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSelectedFiles([]);
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setIsUploadingFiles(false);
    }
  };

  // ❌ Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        fileMenuRef.current &&
        !fileMenuRef.current.contains(e.target)
      ) {
        setShowFileTypeMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-full">

      {/* 💬 Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((m) => (
          <Message key={m._id} msg={m} myId={user._id} />
        ))}
      </div>

      {/* 📁 Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="p-2 bg-gray-100 flex gap-2 overflow-x-auto">
          {selectedFiles.map((file, i) => (
            <div key={i} className="relative">
              <p className="text-xs">{file.name}</p>
              <button
                onClick={() => removeFile(i)}
                className="text-red-500 text-xs"
              >
                ❌
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ✏️ Input */}
      <div className="p-3 border-t flex gap-2 items-end">

        {/* 😊 Emoji */}
        <button onClick={() => setShowEmoji(!showEmoji)}>
          😊
        </button>

        {showEmoji && (
          <div className="absolute bottom-20">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}

        {/* 📂 Attach */}
        <div className="relative" ref={fileMenuRef}>
          <button onClick={() => setShowFileTypeMenu(!showFileTypeMenu)}>
            🔗
          </button>

          {showFileTypeMenu && (
            <div className="absolute bottom-10 bg-white shadow p-2">
              {fileTypeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => openFilePicker(opt.accept)}
                  className="block w-full text-left"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* 📝 Input */}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border p-2 rounded"
        />

        {/* 📤 Send */}
        <button onClick={sendMessage}>Send</button>

        {/* 📤 Send Files */}
        {selectedFiles.length > 0 && (
          <button onClick={sendFiles}>
            {isUploadingFiles ? "Uploading..." : "Send Files"}
          </button>
        )}
      </div>
    </div>
  );
};

export default Chat;