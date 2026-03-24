import { useEffect, useRef, useState } from "react";
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
    if (!previewAttachment) return;

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

  const bubbleClasses = isMe
    ? "bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] text-white shadow-[0_18px_40px_rgba(37,99,235,0.22)]"
    : "border border-slate-200 bg-white text-slate-900 shadow-sm";

  return (
    <>
      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div
          className={`flex max-w-[85%] flex-col ${
            isMe ? "items-end" : "items-start"
          } sm:max-w-[78%] lg:max-w-[70%]`}
        >
          <div
            ref={menuRef}
            className={`relative w-full rounded-[26px] px-4 py-3 ${bubbleClasses}`}
            onClick={() => {
              if (isMe && !msg.isDeletedForEveryone) {
                setShowMenu((prev) => !prev);
              }
            }}
          >
            {/* ✅ FIX: disable menu if deleted */}
            {showMenu && isMe && !editing && !msg.isDeletedForEveryone && (
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
                    socket.emit("delete_message", msg._id);
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
                {/* message */}
                {msg.isDeletedForEveryone ? (
                  <p className="italic text-gray-400 text-sm">
                    This message was deleted
                  </p>
                ) : (
                  !!msg.message && (
                    <p className="whitespace-pre-wrap break-words text-[15px] leading-6">
                      {msg.message}
                    </p>
                  )
                )}

                {/* attachments */}
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
                          className={`group max-w-full overflow-hidden rounded-3xl border text-left transition ${
                            isMe
                              ? "border-white/20 bg-white/12 hover:bg-white/18"
                              : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                          }`}
                        >
                          {kind === "image" && (
                            <img
                              src={attachment.url}
                              alt={attachment.originalName || "attachment"}
                              className="h-auto max-h-72 w-full object-cover"
                            />
                          )}

                          {kind === "video" && (
                            <video
                              src={attachment.url}
                              controls
                              className="h-auto max-h-72 w-full bg-black"
                            />
                          )}

                          {kind === "pdf" && (
                            <div className="h-32 flex items-center justify-center">
                              PDF
                            </div>
                          )}

                          {kind === "file" && (
                            <div className="h-28 flex items-center justify-center">
                              FILE
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

          <div className={`mt-1 px-2 text-xs ${isMe ? "text-slate-400" : "text-slate-500"}`}>
            {msg.isEdited ? "edited" : ""}
          </div>
        </div>
      </div>
    </>
  );
};

export default Message;