import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";

const imageFormats = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
const videoFormats = ["mp4", "mov", "webm", "m4v"];
const pdfFormats = ["pdf"];

const getAttachmentKind = (attachment) => {
  const format = attachment.format?.toLowerCase();
  const mimeType = attachment.mimeType?.toLowerCase() || "";

  if (mimeType === "application/pdf") {
    return "pdf";
  }

  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (attachment.resourceType === "image" || imageFormats.includes(format)) {
    return "image";
  }

  if (attachment.resourceType === "video" || videoFormats.includes(format)) {
    return "video";
  }

  if (pdfFormats.includes(format)) {
    return "pdf";
  }

  return "file";
};

const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileLabel = (kind) => {
  if (kind === "image") return "Image";
  if (kind === "video") return "Video";
  if (kind === "pdf") return "PDF";
  return "File";
};

const Message = ({ msg, myId }) => {
  const messageFrom = msg.from?._id || msg.from;
  const isMe = messageFrom === myId;

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(msg.message || "");
  const [showMenu, setShowMenu] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    setText(msg.message || "");
  }, [msg.message]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    if (!previewAttachment) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setPreviewAttachment(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [previewAttachment]);

  const handleEdit = () => {
    socket.emit("edit_message", {
      messageId: msg._id,
      newText: text,
    });
    setEditing(false);
  };

  const handleDelete = () => {
    socket.emit("delete_message", msg._id);
  };

  const renderPreview = () => {
    if (!previewAttachment) return null;

    const kind = getAttachmentKind(previewAttachment);

    if (kind === "image") {
      return (
        <img
          src={previewAttachment.url}
          alt={previewAttachment.originalName || "attachment"}
          className="max-h-[78vh] w-full rounded-2xl object-contain"
        />
      );
    }

    if (kind === "video") {
      return (
        <video
          src={previewAttachment.url}
          controls
          playsInline
          className="max-h-[78vh] w-full rounded-2xl bg-black"
        />
      );
    }

    if (kind === "pdf") {
      return (
        <object
          data={previewAttachment.url}
          type="application/pdf"
          className="h-[78vh] w-full rounded-2xl border border-slate-200 bg-white"
        >
          <iframe
            src={previewAttachment.url}
            title={previewAttachment.originalName || "PDF preview"}
            className="h-[78vh] w-full rounded-2xl border border-slate-200 bg-white"
          />
        </object>
      );
    }

    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm text-slate-600">
          This file type cannot be previewed inside the app.
        </p>
        <a
          href={previewAttachment.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white"
        >
          Open file
        </a>
      </div>
    );
  };

  const bubbleClasses = isMe
    ? "bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] text-white shadow-[0_18px_40px_rgba(37,99,235,0.22)]"
    : "border border-slate-200 bg-white text-slate-900 shadow-sm";

  return (
    <>
      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[min(78%,42rem)] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
          <div
            ref={menuRef}
            className={`relative w-full rounded-[26px] px-4 py-3 ${bubbleClasses}`}
            onClick={() => isMe && setShowMenu(!showMenu)}
          >
            {showMenu && isMe && !editing && (
              <div className="absolute right-2 top-[-5.25rem] z-20 w-32 rounded-2xl border border-slate-200 bg-white p-1 text-sm text-slate-700 shadow-xl">
                <button
                  className="block w-full rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
                  onClick={() => {
                    setEditing(true);
                    setShowMenu(false);
                  }}
                >
                  Edit
                </button>
                <button
                  className="block w-full rounded-xl px-3 py-2 text-left text-rose-500 transition hover:bg-rose-50"
                  onClick={() => {
                    handleDelete();
                    setShowMenu(false);
                  }}
                >
                  Delete
                </button>
              </div>
            )}

            {editing ? (
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button
                  className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-white"
                  onClick={handleEdit}
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                {!!msg.message && (
                  <p className="whitespace-pre-wrap break-words text-[15px] leading-6">
                    {msg.message}
                  </p>
                )}

                {!!msg.attachments?.length && (
                  <div className={`grid gap-3 ${msg.message ? "mt-3" : ""}`}>
                    {msg.attachments.map((attachment, index) => {
                      const kind = getAttachmentKind(attachment);

                      return (
                        <button
                          key={`${attachment.publicId || attachment.url}-${index}`}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPreviewAttachment(attachment);
                          }}
                          className={`group overflow-hidden rounded-3xl border text-left transition ${
                            isMe
                              ? "border-white/20 bg-white/12 hover:bg-white/18"
                              : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                          }`}
                        >
                          {kind === "image" && (
                            <img
                              src={attachment.url}
                              alt={attachment.originalName || "attachment"}
                              className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.01]"
                            />
                          )}

                          {kind === "video" && (
                            <div className="relative">
                              <video
                                src={attachment.url}
                                controls
                                playsInline
                                className="h-56 w-full bg-black object-cover"
                                onClick={(event) => event.stopPropagation()}
                              />
                            </div>
                          )}

                          {kind === "pdf" && (
                            <div className="flex h-40 items-center justify-center bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)] px-6">
                              <div className="rounded-3xl border border-rose-100 bg-white px-6 py-5 text-center shadow-sm">
                                <div className="text-2xl font-bold text-rose-500">PDF</div>
                                <div className="mt-1 text-sm text-slate-500">
                                  Tap to preview
                                </div>
                              </div>
                            </div>
                          )}

                          {kind === "file" && (
                            <div className="flex h-32 items-center justify-center bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)] px-6">
                              <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-center shadow-sm">
                                <div className="text-lg font-semibold text-slate-700">FILE</div>
                                <div className="mt-1 text-sm text-slate-500">
                                  Tap to open
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-3 px-4 py-3">
                            <div className="min-w-0">
                              <div className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${isMe ? "text-sky-100/80" : "text-slate-400"}`}>
                                {getFileLabel(kind)}
                              </div>
                              <div className="truncate text-sm font-medium">
                                {attachment.originalName || "Attachment"}
                              </div>
                            </div>
                            <div className={`shrink-0 text-xs ${isMe ? "text-sky-100/90" : "text-slate-500"}`}>
                              {formatFileSize(attachment.bytes)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className={`mt-1 px-2 text-xs ${isMe ? "text-slate-400" : "text-slate-500"}`}>
            {msg.isEdited ? "edited" : ""}
          </div>
        </div>
      </div>

      {previewAttachment && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="w-full max-w-5xl rounded-[30px] border border-white/10 bg-white p-4 shadow-[0_30px_100px_rgba(15,23,42,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-slate-900">
                  {previewAttachment.originalName || "Attachment"}
                </p>
                <p className="text-sm text-slate-500">
                  {formatFileSize(previewAttachment.bytes)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={previewAttachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
                >
                  Open
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>

            {renderPreview()}
          </div>
        </div>
      )}
    </>
  );
};

export default Message;
