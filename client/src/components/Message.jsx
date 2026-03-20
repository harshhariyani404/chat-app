import { useState } from "react";
import { socket } from "../socket";

const Message = ({ msg, myId }) => {
  const isMe = msg.from === myId;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(msg.message);
  const [showMenu, setShowMenu] = useState(false);

  const handleEdit = () => {
    if (!text.trim()) return;

    socket.emit("edit_message", {
      messageId: msg._id,
      newText: text,
    });
    setEditing(false);
  };

  const handleDelete = () => {
    socket.emit("delete_message", msg._id);
  };

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`message-bubble ${isMe ? "message-bubble-me" : "message-bubble-them"}`}
        onClick={() => isMe && !editing && setShowMenu((prev) => !prev)}
      >
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              className="w-full rounded-xl border border-black/10 bg-white/90 px-3 py-2 text-sm text-slate-800 outline-none"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              type="button"
              className="rounded-xl bg-white/20 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white"
              onClick={handleEdit}
            >
              Save
            </button>
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap break-words leading-6">{msg.message}</p>
            {msg.isEdited && (
              <p className={`mt-2 text-[11px] ${isMe ? "text-white/75" : "text-slate-400"}`}>
                Edited
              </p>
            )}
          </>
        )}

        {showMenu && isMe && !editing && (
          <div className="absolute right-0 top-full z-10 mt-2 min-w-32 overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 shadow-xl">
            <button
              type="button"
              className="block w-full px-4 py-2 text-left transition hover:bg-slate-50"
              onClick={() => {
                setEditing(true);
                setShowMenu(false);
              }}
            >
              Edit
            </button>

            <button
              type="button"
              className="block w-full px-4 py-2 text-left text-red-500 transition hover:bg-red-50"
              onClick={() => {
                handleDelete();
                setShowMenu(false);
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
