import { useEffect, useRef, useState } from "react";
import axios from "axios";
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





const API_BASE_URL = "http://localhost:5000";

const Message = ({ msg, myId }) => {
  const messageFrom = msg.from?._id || msg.from;
  const isMe = messageFrom === myId;
  const token = localStorage.getItem("token");

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(msg.message || "");
  const [showMenu, setShowMenu] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEdit = async () => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/messages/${msg._id}`,
        { newText: text },
        { headers: { Authorization: token } }
      );
      setEditing(false);
    } catch (error) {
      console.log("Error editing message:", error);
    }
  };

  const handleDeleteForMe = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/messages/${msg._id}/for-me`, {
        headers: { Authorization: token },
      });
      setShowMenu(false);
    } catch (error) {
      console.log("Error deleting message for me:", error);
    }
  };

  const handleDeleteForEveryone = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/messages/${msg._id}`, {
        headers: { Authorization: token },
      });
      setShowMenu(false);
    } catch (error) {
      console.log("Error deleting message for everyone:", error);
    }
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
            onClick={() => {
              if (isMe && !msg.isDeletedForEveryone) {
                setShowMenu((prev) => !prev);
              }
            }}
          >
            {/* ✅ FIX: disable menu if deleted */}
            {showMenu && isMe && !editing && !msg.isDeletedForEveryone && (
              <div className="absolute bottom-full right-0 z-100 mb-2 w-32 rounded-2xl border border-slate-200 bg-white p-1 text-sm text-slate-700 shadow-xl">
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
                  type="button"
                  className="block min-h-[44px] w-full rounded-xl px-3 py-2 text-left text-rose-600 transition hover:bg-rose-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteModal(true);
                    setShowMenu(false);
                  }}
                >
                  Delete
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
                  <p className="italic text-black text-sm">
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
                          className={`group max-w-full overflow-hidden rounded-3xl border text-left transition ${isMe
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
                            <div className="relative flex h-auto max-h-72 w-full items-center justify-center bg-black">
                              <video
                                src={attachment.url}
                                className="h-auto max-h-72 w-full opacity-80"
                              />
                              <div className="absolute inset-0 flex items-center justify-center text-3xl text-white opacity-80 drop-shadow-md">▶</div>
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
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className={`mt-1 px-2 text-xs ${isMe ? "text-slate-400" : "text-slate-500"}`}>
            <div className="flex gap-2 items-center">
              <span>{msg.isEdited ? "edited" : ""}</span>
              <span>{formatTime(msg.createdAt)}</span>
            </div>
          </div>
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
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            </a>
            <button
              className="rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              onClick={() => setPreviewAttachment(null)}
              title="Close"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div
            className="relative flex h-full w-full items-center justify-center p-8 sm:p-12"
            onClick={(e) => e.stopPropagation()}
          >
            {getAttachmentKind(previewAttachment) === "image" && (
              <img src={previewAttachment.url} alt="Preview" className="max-h-full max-w-full object-contain" />
            )}
            {getAttachmentKind(previewAttachment) === "video" && (
              <video src={previewAttachment.url} controls autoPlay className="max-h-full max-w-full rounded-lg bg-black" />
            )}
            {getAttachmentKind(previewAttachment) === "pdf" && (
              <iframe src={previewAttachment.url} className="h-full w-full rounded-xl bg-white" title="PDF Preview" />
            )}
            {getAttachmentKind(previewAttachment) === "file" && (
              <div className="flex max-w-full flex-col items-center justify-center overflow-hidden rounded-3xl bg-white p-10 text-center shadow-2xl">
                <div className="mb-4 text-5xl">📄</div>
                <p className="w-full break-words text-xl font-bold text-slate-800">
                  {previewAttachment.originalName || "File Attachment"}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  No preview available
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteModal(false);
          }}
        >
          <div
            className="w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <h3 className="text-lg font-bold text-slate-900">Delete Message</h3>
              <p className="mt-2 text-sm text-slate-500">
                Who do you want to delete this message for?
              </p>
            </div>
            <div className="flex flex-col border-t border-slate-100 bg-slate-50">
              <button
                className="w-full border-b border-slate-100 px-4 py-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteForEveryone();
                  setShowDeleteModal(false);
                }}
              >
                Delete for everyone
              </button>
              <button
                className="w-full border-b border-slate-100 px-4 py-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteForMe();
                  setShowDeleteModal(false);
                }}
              >
                Delete for me
              </button>
              <button
                className="w-full px-4 py-4 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteModal(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Message;
