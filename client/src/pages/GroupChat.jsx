import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import GroupSettingsDrawer from "../components/GroupSettingsDrawer";
import { api } from "../lib/api";
import { getAvatarUrl } from "../lib/avatar";
import { socket } from "../socket";

const imageFormats = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
const videoFormats = ["mp4", "mov", "webm", "m4v"];
const pdfFormats = ["pdf"];

const getAttachmentKind = (attachment) => {
  const format = attachment.format?.toLowerCase();
  const mimeType = attachment.mimeType?.toLowerCase() || "";

  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";

  if (attachment.resourceType === "image" || imageFormats.includes(format)) return "image";
  if (attachment.resourceType === "video" || videoFormats.includes(format)) return "video";
  if (pdfFormats.includes(format)) return "pdf";

  return "file";
};

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

const GroupMessageBubble = ({ msg, myId }) => {
  const fromId = msg.from?._id || msg.from;
  const isMe = fromId === myId;
  const name = msg.from?.username || "Unknown";
  const [previewAttachment, setPreviewAttachment] = useState(null);

  return (
    <>
      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div
          className={`mb-2 max-w-[85%] rounded-[22px] px-4 py-2.5 text-sm shadow-sm sm:max-w-[78%] ${
            isMe
              ? "bg-gradient-to-br from-indigo-600 to-violet-700 text-white ring-1 ring-white/10"
              : "border border-slate-200/90 bg-white text-slate-900 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)]"
          }`}
        >
          {!isMe && <p className="mb-1 text-xs font-bold text-indigo-600">{name}</p>}
          {!!msg.message?.trim() && (
            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
          )}
          {!!msg.attachments?.length && (
            <div className={`grid gap-2 ${msg.message?.trim() ? "mt-2" : ""}`}>
              {msg.attachments.map((attachment, index) => {
                const kind = getAttachmentKind(attachment);
                return (
                  <button
                    key={`${attachment.publicId || attachment.url}-${index}`}
                    type="button"
                    onClick={() => setPreviewAttachment(attachment)}
                    className={`max-w-full overflow-hidden rounded-xl border text-left transition ${
                      isMe
                        ? "border-white/20 bg-white/12 hover:bg-white/18"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    {kind === "image" && (
                      <img
                        src={attachment.url}
                        alt={attachment.originalName || ""}
                        className="max-h-56 w-full object-cover"
                      />
                    )}
                    {kind === "video" && (
                      <div className="relative flex max-h-56 w-full items-center justify-center bg-black/80">
                        <video src={attachment.url} className="max-h-56 w-full opacity-80" />
                        <span className="absolute text-2xl text-white/90">▶</span>
                      </div>
                    )}
                    {kind === "pdf" && (
                      <div className="flex h-28 items-center justify-center px-4">
                        <span className={`text-sm font-semibold ${isMe ? "text-white" : "text-rose-600"}`}>PDF</span>
                      </div>
                    )}
                    {kind === "file" && (
                      <div className="flex h-24 items-center justify-center px-4">
                        <span className={`text-xs font-semibold ${isMe ? "text-indigo-100" : "text-slate-600"}`}>
                          {attachment.originalName || "File"}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <p className={`mt-1.5 text-[10px] ${isMe ? "text-indigo-100/90" : "text-slate-400"}`}>
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      {previewAttachment && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewAttachment(null)}
        >
          <div className="absolute right-6 top-6 z-10 flex items-center gap-3">
            <a
              href={previewAttachment.url}
              download={previewAttachment.originalName || "download"}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              onClick={(e) => e.stopPropagation()}
              title="Download"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </a>
            <button
              type="button"
              className="rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              onClick={() => setPreviewAttachment(null)}
              title="Close"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div
            className="relative flex h-full w-full items-center justify-center p-8 sm:p-12"
            onClick={(e) => e.stopPropagation()}
          >
            {getAttachmentKind(previewAttachment) === "image" && (
              <img
                src={previewAttachment.url}
                alt="Preview"
                className="max-h-full max-w-full object-contain"
              />
            )}
            {getAttachmentKind(previewAttachment) === "video" && (
              <video
                src={previewAttachment.url}
                controls
                autoPlay
                className="max-h-full max-w-full rounded-lg bg-black"
              />
            )}
            {getAttachmentKind(previewAttachment) === "pdf" && (
              <iframe src={previewAttachment.url} className="h-full w-full rounded-xl bg-white" title="PDF" />
            )}
            {getAttachmentKind(previewAttachment) === "file" && (
              <div className="rounded-3xl bg-white p-10 text-center shadow-2xl">
                <p className="text-lg font-bold text-slate-800">{previewAttachment.originalName || "File"}</p>
                <p className="mt-2 text-sm text-slate-500">Open via download</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const GroupChat = ({ user, group, onBack, onGroupUpdated, onGroupDeleted }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [typingName, setTypingName] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [showFileTypeMenu, setShowFileTypeMenu] = useState(false);
  const chatRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiRef = useRef(null);
  const fileInputRef = useRef(null);
  const fileMenuRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/groups/${group._id}/messages`);
        setMessages(res.data);
      } catch {
        toast.error("Unable to load group messages.");
      }
    };

    void fetchMessages();
  }, [group._id]);

  useEffect(() => {
    socket.emit("join-group", { groupId: group._id });

    const onMsg = (data) => {
      const gid = data.group?._id || data.group;
      if (String(gid) !== String(group._id)) {
        return;
      }

      setMessages((prev) => {
        if (prev.some((m) => m._id === data._id)) {
          return prev;
        }
        return [...prev, data];
      });
    };

    const onTyping = ({ groupId, from, username }) => {
      if (groupId !== group._id || from === user._id) {
        return;
      }

      setTypingName(username || "Someone");

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setTypingName("");
      }, 2000);
    };

    socket.on("group-message", onMsg);
    socket.on("group-typing", onTyping);

    return () => {
      socket.emit("leave-group", { groupId: group._id });
      socket.off("group-message", onMsg);
      socket.off("group-typing", onTyping);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [group._id, user._id]);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  useEffect(() => {
    const onDoc = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target)) {
        setShowFileTypeMenu(false);
      }
    };

    if (showEmoji || showFileTypeMenu) {
      document.addEventListener("mousedown", onDoc);
    }

    return () => document.removeEventListener("mousedown", onDoc);
  }, [showEmoji, showFileTypeMenu]);

  const sendText = () => {
    const t = text.trim();
    if (!t) {
      return;
    }

    socket.emit("group-message", {
      groupId: group._id,
      from: user._id,
      message: t,
      attachments: [],
    });

    setText("");
  };

  const sendFiles = async () => {
    if (!selectedFiles.length) return;

    try {
      setIsUploadingFiles(true);
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      if (text.trim()) {
        formData.append("message", text.trim());
      }

      await api.post(`/groups/${group._id}/messages/files`, formData);
      setText("");
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload files");
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleComposerSubmit = () => {
    if (selectedFiles.length > 0) {
      void sendFiles();
      return;
    }

    sendText();
  };

  const onTypingInput = (v) => {
    setText(v);

    socket.emit("group-typing", {
      groupId: group._id,
      from: user._id,
      username: user.username,
    });
  };

  const openFilePicker = (accept) => {
    setShowFileTypeMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const adminId = group.admin?._id || group.admin;
  const groupHeaderAvatar =
    getAvatarUrl(group.avatar) ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(group.name || "G")}`;

  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden border border-slate-200/80 bg-white/95 shadow-panel backdrop-blur-xl md:mx-4 md:mt-4 md:rounded-3xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.06),transparent_50%)]" />
      <header className="relative flex items-center gap-2 border-b border-slate-200/80 px-3 py-3 sm:gap-3 sm:px-4 sm:py-4">
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 rounded-2xl border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 md:hidden"
        >
          ← Back
        </button>
        <img
          src={groupHeaderAvatar}
          alt=""
          className="hidden h-11 w-11 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200/80 sm:block"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">{group.name}</p>
          <p className="text-[11px] font-medium text-slate-500 sm:text-xs">
            {group.members?.length || 0} members
            {adminId === user._id ? " · You’re admin" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="shrink-0 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          title="Group settings"
          aria-label="Group settings"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {showSettings && (
        <GroupSettingsDrawer
          group={group}
          user={user}
          onClose={() => setShowSettings(false)}
          onGroupUpdated={(g) => onGroupUpdated?.(g)}
          onGroupDeleted={(id) => {
            onGroupDeleted?.(id);
            setShowSettings(false);
          }}
        />
      )}

      <div ref={chatRef} className="relative min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <GroupMessageBubble key={m._id} msg={m} myId={user._id} />
        ))}
        {typingName && (
          <p className="text-xs font-medium italic text-indigo-500/80">{typingName} is typing…</p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          setSelectedFiles(Array.from(e.target.files || []));
          setShowFileTypeMenu(false);
        }}
      />

      <div className="relative border-t border-slate-200/80 bg-white/90 p-3 backdrop-blur-sm">
        {showEmoji && (
          <div ref={emojiRef} className="absolute bottom-full left-4 z-50 mb-2 overflow-hidden rounded-2xl border border-slate-200 shadow-xl">
            <EmojiPicker onEmojiClick={(e) => setText((p) => p + e.emoji)} />
          </div>
        )}

        {!!selectedFiles.length && (
          <div className="mb-2 rounded-2xl border border-indigo-200/80 bg-indigo-50/80 px-3 py-2 text-xs text-indigo-900">
            <span className="font-semibold">{selectedFiles.length}</span> file{selectedFiles.length > 1 ? "s" : ""}{" "}
            ready — Send uploads or clear.
            <button
              type="button"
              className="ml-2 font-semibold text-rose-600 underline"
              onClick={() => {
                setSelectedFiles([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Clear
            </button>
          </div>
        )}

        <div className="relative flex items-end gap-2">
          <div className="relative shrink-0" ref={fileMenuRef}>
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50"
              onClick={() => setShowFileTypeMenu((s) => !s)}
              title="Attach files"
              aria-label="Attach files"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </button>
            {showFileTypeMenu && (
              <div className="absolute bottom-full left-0 z-50 mb-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                {fileTypeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => openFilePicker(opt.accept)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-lg transition hover:border-indigo-200 hover:bg-indigo-50"
            onClick={() => setShowEmoji((s) => !s)}
          >
            🙂
          </button>
          <textarea
            rows={1}
            className="max-h-32 min-h-[48px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
            placeholder="Message the group…"
            value={text}
            onChange={(e) => onTypingInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleComposerSubmit();
              }
            }}
          />
          <button
            type="button"
            onClick={handleComposerSubmit}
            disabled={(!text.trim() && selectedFiles.length === 0) || isUploadingFiles}
            className="shrink-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
          >
            {isUploadingFiles ? "…" : "Send"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default GroupChat;
