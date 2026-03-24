import { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import Message from "./Message";
import { socket } from "../socket";

const API_BASE_URL = "http://localhost:5000";
const imageMimePrefix = "image/";
const videoMimePrefix = "video/";

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

const getSelectedFileKind = (file) => {
  const mimeType = file?.type?.toLowerCase() || "";

  if (mimeType === "application/pdf") {
    return "pdf";
  }

  if (mimeType.startsWith(imageMimePrefix)) {
    return "image";
  }

  if (mimeType.startsWith(videoMimePrefix)) {
    return "video";
  }

  return "file";
};

const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const Chat = ({ user, selected, setUsers }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFilePreviews, setSelectedFilePreviews] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showFileTypeMenu, setShowFileTypeMenu] = useState(false);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const fileMenuRef = useRef(null);
  const emojiMenuRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!selected) return;

    setMessages([]);
    setText("");
    setSelectedFiles([]);
    setShowEmoji(false);
    setShowFileTypeMenu(false);

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/messages/${selected._id}`,
          { headers: { Authorization: token } }
        );
        setMessages(res.data);
      } catch (err) {
        console.log("Error loading messages:", err);
      }
    };

    fetchMessages();

    const handleReceiveMessage = (data) => {
      const fromId = data.from?._id || data.from;
      const toId = data.to?._id || data.to;

      if (
        (fromId === user._id && toId === selected._id) ||
        (fromId === selected._id && toId === user._id)
      ) {
        setMessages((prev) => {
          if (prev.some((message) => message._id === data._id)) {
            return prev;
          }

          return [...prev, data];
        });
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => socket.off("receive_message", handleReceiveMessage);
  }, [selected, token, user._id]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [selected]);

  useEffect(() => {
    const nextPreviews = selectedFiles.map((file) => {
      const kind = getSelectedFileKind(file);

      return {
        file,
        kind,
        previewUrl:
          kind === "image" || kind === "video" ? URL.createObjectURL(file) : null,
      };
    });

    setSelectedFilePreviews(nextPreviews);

    return () => {
      nextPreviews.forEach(({ previewUrl }) => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      });
    };
  }, [selectedFiles]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target)) {
        setShowFileTypeMenu(false);
      }

      if (emojiMenuRef.current && !emojiMenuRef.current.contains(event.target)) {
        setShowEmoji(false);
      }
    };

    if (showEmoji || showFileTypeMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmoji, showFileTypeMenu]);

  const addUserToSidebar = () => {
    if (!setUsers || !selected) return;

    setUsers((prev) => {
      const exists = prev.find((item) => item._id === selected._id);
      if (exists) return prev;
      return [...prev, selected];
    });
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  const sendMessage = () => {
    if (!text.trim() || !selected) return;

    socket.emit("send_message", {
      from: user._id,
      to: selected._id,
      message: text.trim(),
      attachments: [],
    });

    addUserToSidebar();
    setText("");
    setShowEmoji(false);
  };

  const handleComposerSubmit = () => {
    if (selectedFiles.length > 0) {
      sendFiles();
      return;
    }

    sendMessage();
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setShowFileTypeMenu(false);
  };

  const openFilePicker = (accept) => {
    setShowFileTypeMenu(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const sendFiles = async () => {
    if (!selectedFiles.length || !selected) return;

    try {
      setIsUploadingFiles(true);

      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));

      if (text.trim()) {
        formData.append("message", text.trim());
      }

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

      addUserToSidebar();
      setText("");
      setSelectedFiles([]);
      setShowEmoji(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.log("Error uploading files:", err);
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setIsUploadingFiles(false);
    }
  };

  if (!selected) {
    return (
      <section className="flex min-w-0 flex-1 items-center justify-center rounded-[28px] border border-slate-200 bg-white/80 p-6 text-center text-slate-500 shadow-sm">
        Select a chat to start messaging.
      </section>
    );
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="truncate text-lg font-semibold text-slate-900">
          {selected.displayName || selected.username}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {selected.isOnline ? "Online" : "Start your conversation here"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-slate-500">
            No messages yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <Message key={message._id} msg={message} myId={user._id} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-4">
        {selectedFilePreviews.length > 0 && (
          <div className="mb-3 rounded-3xl border border-sky-100 bg-sky-50 p-3">
            <p className="mb-3 text-sm font-semibold text-sky-900">
              Ready to send {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""}
            </p>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {selectedFilePreviews.map(({ file, kind, previewUrl }, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="overflow-hidden rounded-3xl border border-sky-200 bg-white"
                >
                  {kind === "image" && previewUrl && (
                    <img
                      src={previewUrl}
                      alt={file.name}
                      className="h-36 w-full object-cover"
                    />
                  )}

                  {kind === "video" && previewUrl && (
                    <video
                      src={previewUrl}
                      controls
                      className="h-36 w-full bg-black object-cover"
                    />
                  )}

                  {kind === "pdf" && (
                    <div className="flex h-36 items-center justify-center bg-slate-100 text-lg font-semibold text-rose-500">
                      PDF
                    </div>
                  )}

                  {kind === "file" && (
                    <div className="flex h-36 items-center justify-center bg-slate-100 text-sm font-semibold text-slate-600">
                      FILE
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {file.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="rounded-full px-2 py-1 text-sm font-medium text-rose-500 transition hover:bg-rose-50"
                      onClick={() => removeSelectedFile(index)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 rounded-[28px] border border-slate-200 bg-slate-50 px-3 py-3 shadow-inner">
          <div className="relative shrink-0" ref={fileMenuRef}>
            <button
              type="button"
              onClick={() => setShowFileTypeMenu((prev) => !prev)}
              className="inline-flex h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:bg-sky-50"
            >
              Attach
            </button>

            {showFileTypeMenu && (
              <div className="absolute bottom-14 left-0 z-30 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_40px_rgba(15,23,42,0.16)]">
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Choose file type
                </p>
                {fileTypeOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="flex w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
                    onClick={() => openFilePicker(option.accept)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="*/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="relative shrink-0" ref={emojiMenuRef}>
            <button
              type="button"
              onClick={() => setShowEmoji((prev) => !prev)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl transition hover:border-sky-200 hover:bg-sky-50"
            >
              😊
            </button>

            {showEmoji && (
              <div className="absolute bottom-14 left-0 z-50">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>

          <textarea
            ref={inputRef}
            value={text}
            rows="1"
            placeholder="Write a message..."
            className="h-11 min-w-0 flex-1 resize-none rounded-2xl border border-white bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-sky-200"
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleComposerSubmit();
              }
            }}
          />

          <button
            type="button"
            onClick={handleComposerSubmit}
            disabled={(!text.trim() && selectedFiles.length === 0) || isUploadingFiles}
            className="h-11 shrink-0 rounded-2xl bg-sky-500 px-5 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploadingFiles ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Chat;
