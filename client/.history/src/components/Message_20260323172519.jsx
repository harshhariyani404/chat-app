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
          className="max-h-[78vh] max-w-full rounded-2xl object-contain"
        />
      );
    }

    if (kind === "video") {
      return (
        <video
          src={previewAttachment.url}
          controls
          playsInline
          className="max-h-[78vh] max-w-full rounded-2xl bg-black"
        />
      );
    }

    if (kind === "pdf") {
      return (
        <object
          data={previewAttachment.url}
          type="application/pdf"
          className="h-[70vh] w-full rounded-2xl border border-slate-200 bg-white sm:h-[78vh]"
        >
          <iframe
            src={previewAttachment.url}
            title={previewAttachment.originalName || "PDF preview"}
            className="h-[70vh] w-full rounded-2xl border border-slate-200 bg-white sm:h-[78vh]"
          />
        </object>
      );
    }

    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center sm:p-8">
        <p className="text-sm text-slate-600">
          This file type cannot be previewed inside the app.
        </p>
        <a
          href={previewAttachment.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white"
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
        <div
          className={`flex max-w-[85%] flex-col ${isMe ? "items-end" : "items-start"
            } sm:max-w-[78%] lg:max-w-[70%]`}
        >
          <div
            ref={menuRef}
            className={`relative w-full rounded-[26px] px-4 py-3 ${bubbleClasses}`}
            onClick={() => isMe && setShowMenu((prev) => !prev)}
          >
            {showMenu && isMe && !editing && (
              <div className="absolute bottom-full right-0 z-20 mb-2 w-32 rounded-2xl border border-slate-200 bg-white p-1 text-sm text-slate-700 shadow-xl">
                <button
                  className="block min-h-[44px] w-full rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
                  onClick={() => {
                    setEditing(true);
                    setShowMenu(false);
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    socket.emit("delete_for_me", msg._id);
                    setShowMenu(false);
                  }}
                >
                  Delete for me
                </button>

                <button
                  onClick={() => {
                    socket.emit("delete_message", msg._id); // for everyone
                    setShowMenu(false);
                  }}
                >
                  Delete for everyone
                </button>
              </div>
            )}

            {editing ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="min-h-[44px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button
                  className="min-h-[44px] rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-white"
                  onClick={handleEdit}
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                {msg.isDeletedForEveryone ? (
                  <p className="italic text-gray-400">
                    This message was deleted
                  </p>
                ) : (
                  !!msg.message && (
                    <p className="whitespace-pre-wrap break-words text-[15px] leading-6">
                      {msg.message}
                    </p>
                  )
                )}

                {!msg.isDeletedForEveryone && !!msg.attachments?.length && (
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
                          className={`group max-w-full overflow-hidden rounded-3xl border text-left transition ${isMe
                            ? "border-white/20 bg-white/12 hover:bg-white/18"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                            }`}
                        >
                          {kind === "image" && (
                            <img
                              src={attachment.url}
                              alt={attachment.originalName || "attachment"}
                              className="h-auto max-h-72 w-full max-w-full object-cover transition duration-300 group-hover:scale-[1.01]"
                            />
                          )}

                          {kind === "video" && (
                            <div className="relative">
                              <video
                                src={attachment.url}
                                controls
                                playsInline
                                className="h-auto max-h-72 w-full max-w-full bg-black object-cover"
                                onClick={(event) => event.stopPropagation()}
                              />
                            </div>
                          )}

                          {kind === "pdf" && (
                            <div className="flex h-32 items-center justify-center bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)] px-4 sm:h-40 sm:px-6">
                              <div className="rounded-3xl border border-rose-100 bg-white px-5 py-4 text-center shadow-sm">
                                <div className="text-2xl font-bold text-rose-500">PDF</div>
                                <div className="mt-1 text-sm text-slate-500">
                                  Tap to preview
                                </div>
                              </div>
                            </div>
                          )}

                          {kind === "file" && (
                            <div className="flex h-28 items-center justify-center bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)] px-4 sm:h-32 sm:px-6">
                              <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
                                <div className="text-lg font-semibold text-slate-700">FILE</div>
                                <div className="mt-1 text-sm text-slate-500">
                                  Tap to open
                                </div>
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div
            className={`mt-1 px-2 text-xs ${isMe ? "text-slate-400" : "text-slate-500"
              }`}
          >
            {msg.isEdited ? "edited" : ""}
          </div>
        </div>
      </div>

      {previewAttachment && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-4"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="w-full max-w-5xl rounded-[30px] border border-white/10 bg-white p-3 shadow-[0_30px_100px_rgba(15,23,42,0.45)] sm:p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={previewAttachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
                >
                  Open
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
