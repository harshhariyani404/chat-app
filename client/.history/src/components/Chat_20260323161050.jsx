import { useEffect, useRef, useState } from "react";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import toast from "react-hot-toast";
import { socket } from "../socket";
import Message from "./Message";

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

const Chat = ({ user, selected, setSelected, setUsers, fetchUsers }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [newName, setNewName] = useState("");
  const [showInfoMenu, setShowInfoMenu] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFilePreviews, setSelectedFilePreviews] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showFileTypeMenu, setShowFileTypeMenu] = useState(false);
  const [fileInputAccept, setFileInputAccept] = useState("*/*");
  const [emojiPickerWidth, setEmojiPickerWidth] = useState(320);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const infoMenuRef = useRef(null);
  const fileMenuRef = useRef(null);
  const emojiRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!selected) return;

    setMessages([]);
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
    inputRef.current?.focus();
  }, [selected]);

  useEffect(() => {
    setShowInfoMenu(false);
    setNewName(selected?.displayName || selected?.username || "");
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
      if (infoMenuRef.current && !infoMenuRef.current.contains(event.target)) {
        setShowInfoMenu(false);
      }

      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target)) {
        setShowFileTypeMenu(false);
      }

      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmoji(false);
      }
    };

    if (showInfoMenu || showFileTypeMenu || showEmoji) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showInfoMenu, showFileTypeMenu, showEmoji]);

  useEffect(() => {
    const updateEmojiSize = () => {
      if (window.innerWidth < 420) {
        setEmojiPickerWidth(window.innerWidth - 32);
        return;
      }

      if (window.innerWidth < 768) {
        setEmojiPickerWidth(300);
        return;
      }

      setEmojiPickerWidth(340);
    };

    updateEmojiSize();
    window.addEventListener("resize", updateEmojiSize);
    return () => window.removeEventListener("resize", updateEmojiSize);
  }, []);

  const addUserToSidebar = () => {
    setUsers((prev) => {
      const exists = prev.find((u) => u._id === selected._id);
      if (exists) return prev;
      return [...prev, selected];
    });
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  const sendMessage = () => {
    if (!text.trim()) return;

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
    setFileInputAccept(accept);

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
      toast.error(err.response?.data?.message || "Failed to upload files");
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const updateNickname = async () => {
    if (!newName.trim()) return;

    try {
      await axios.post(`${API_BASE_URL}/api/contacts/nickname`, {
        userId: user._id,
        contactUserId: selected._id,
        nickname: newName,
      });

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

      await fetchUsers();
      setShowInfoMenu(false);
      setNewName("");
    } catch (err) {
      console.log("Error updating nickname", err);
      toast.error("Failed to update nickname");
    }
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
    <section className="flex min-w-0 flex-1 flex-col bg-transparent">
      <div className="mx-0 flex min-h-0 flex-1 flex-col overflow-hidden border-y border-white/60 bg-white/72 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl md:mx-4 md:mb-0 md:mt-4 md:rounded-[28px] md:border">
        <div className="border-b border-slate-200/80 bg-white/70 px-4 py-4 sm:px-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <img
              src={
                selected?.avatar
                  ? selected.avatar
                  : `https://api.dicebear.com/7.x/initials/svg?seed=${
                      selected?.displayName || selected?.username || "default"
                    }`
              }
              alt={selected.displayName || selected.username}
              className="h-11 w-11 rounded-2xl object-cover ring-1 ring-slate-200 sm:h-12 sm:w-12"
            />

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
                {selected.displayName || selected.username}
              </h2>

              <p
                className={`mt-0.5 truncate text-sm ${
                  selected.isOnline ? "text-emerald-600" : "text-slate-500"
                }`}
              >
                {selected.isOnline
                  ? "Online now"
                  : `Last seen ${formatTime(selected.lastSeen)}`}
              </p>
            </div>

            <div className="relative shrink-0" ref={infoMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setNewName(selected.displayName || selected.username);
                  setShowInfoMenu((prev) => !prev);
                }}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
              >
                <span className="text-lg leading-none">...</span>
              </button>

              {showInfoMenu && (
                <div className="absolute right-0 top-12 z-20 w-[calc(100vw-2rem)] max-w-[19rem] rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.16)] sm:w-[19rem]">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        selected?.avatar
                          ? selected.avatar
                          : `https://api.dicebear.com/7.x/initials/svg?seed=${
                              selected?.displayName ||
                              selected?.username ||
                              "default"
                            }`
                      }
                      alt={selected.displayName || selected.username}
                      className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-200"
                    />

                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-900">
                        {selected.displayName || selected.username}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        @{selected.username}
                      </p>
                      <p
                        className={`mt-1 text-xs font-medium ${
                          selected.isOnline ? "text-emerald-600" : "text-slate-500"
                        }`}
                      >
                        {selected.isOnline
                          ? "Online now"
                          : `Last seen ${formatTime(selected.lastSeen)}`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Rename Contact
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="min-h-[44px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                        placeholder="Enter display name"
                      />
                      <button
                        onClick={updateNickname}
                        className="min-h-[44px] rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[linear-gradient(180deg,rgba(248,250,252,0.85),rgba(255,255,255,0.96))] px-3 py-4 sm:px-5 sm:py-5">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/80 px-6 py-8 text-center shadow-sm sm:px-8 sm:py-10">
                <p className="text-base font-medium text-slate-600">No messages yet</p>
                <p className="mt-1 text-sm text-slate-400">
                  Send a text or any file type to start the conversation.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {[...messages].reverse().map((m) => (
                <Message key={m._id} msg={m} myId={user._id} />
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200/80 bg-white/80 px-3 py-3 sm:px-5 sm:py-4">
          {!!selectedFiles.length && (
            <div className="mb-3 rounded-3xl border border-sky-100 bg-sky-50/80 p-3">
              <p className="mb-3 text-sm font-semibold text-sky-900">
                Ready to send {selectedFiles.length} file
                {selectedFiles.length > 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {selectedFilePreviews.map(({ file, kind, previewUrl }, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-sm"
                  >
                    {kind === "image" && previewUrl && (
                      <img
                        src={previewUrl}
                        alt={file.name}
                        className="h-40 max-w-full object-cover"
                      />
                    )}

                    {kind === "video" && previewUrl && (
                      <video
                        src={previewUrl}
                        controls
                        className="h-40 max-w-full bg-black object-cover"
                      />
                    )}

                    {kind === "pdf" && (
                      <div className="flex h-40 items-center justify-center bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)]">
                        <div className="rounded-3xl border border-rose-100 bg-white px-6 py-4 text-center shadow-sm">
                          <div className="text-2xl font-bold text-rose-500">PDF</div>
                          <div className="mt-1 text-xs text-slate-500">Preview ready</div>
                        </div>
                      </div>
                    )}

                    {kind === "file" && (
                      <div className="flex h-40 items-center justify-center bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)]">
                        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-center shadow-sm">
                          <div className="text-lg font-semibold text-slate-700">FILE</div>
                          <div className="mt-1 text-xs text-slate-500">Ready to upload</div>
                        </div>
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
                        className="min-h-[44px] rounded-full px-3 py-2 text-sm font-medium text-rose-500 transition hover:bg-rose-50"
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

          <div className="flex flex-wrap items-end gap-2 rounded-[28px] border border-slate-200 bg-slate-50/90 px-3 py-3 shadow-inner sm:flex-nowrap sm:gap-3">
            <div
              className="relative flex w-full items-center gap-2 sm:w-auto"
              ref={fileMenuRef}
            >
              <button
                type="button"
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 sm:flex-none"
                onClick={() => {
                  setShowFileTypeMenu((prev) => !prev);
                  setShowEmoji(false);
                }}
              >
                Attach
              </button>

              {showFileTypeMenu && (
                <div className="absolute bottom-14 left-0 right-0 z-30 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_40px_rgba(15,23,42,0.16)] sm:left-0 sm:right-auto sm:w-48">
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Choose file type
                  </p>
                  {fileTypeOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className="flex min-h-[44px] w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
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
                accept={fileInputAccept}
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              <div className="relative flex-1 sm:flex-none" ref={emojiRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEmoji((prev) => !prev);
                    setShowFileTypeMenu(false);
                  }}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-xl transition hover:border-sky-200 hover:bg-sky-50 sm:w-11"
                >
                  🙂
                </button>

                {showEmoji && (
                  <div className="absolute bottom-14 left-0 right-0 z-50 sm:left-0 sm:right-auto">
                    <div className="max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl shadow-[0_20px_40px_rgba(15,23,42,0.16)]">
                      <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        width={emojiPickerWidth}
                        height={360}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <textarea
              ref={inputRef}
              className="min-h-[44px] max-h-32 min-w-0 flex-1 resize-none rounded-2xl border border-white bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-sky-200"
              value={text}
              rows="1"
              placeholder="Write a message..."
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleComposerSubmit();
                }
              }}
            />

            <button
              className="min-h-[44px] w-full rounded-2xl bg-sky-500 px-5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              onClick={handleComposerSubmit}
              disabled={(!text.trim() && selectedFiles.length === 0) || isUploadingFiles}
            >
              {isUploadingFiles ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Chat;
