import { useState } from "react";
import { socket } from "../socket";

const Message = ({ msg, myId }) => {
  const isMe = msg.from === myId;

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(msg.message);
  const [showMenu, setShowMenu] = useState(false);

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

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className="relative p-2 m-1 bg-gray-200 rounded max-w-xs cursor-pointer"
        onClick={() => isMe && setShowMenu(!showMenu)}
      >
        {/* MESSAGE CONTENT */}
        {editing ? (
          <div className="flex gap-2">
            <input
              className="border p-1 text-sm"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              className="text-green-600 text-sm"
              onClick={handleEdit}
            >
              ✔
            </button>
          </div>
        ) : (
          <>
            <p>{msg.message}</p>
            {msg.isEdited && (
              <span className="text-xs text-gray-500">(edited)</span>
            )}
          </>
        )}

        {/* 🔥 MENU */}
        {showMenu && isMe && !editing && (
          <div className="absolute right-0 mt-1 bg-white shadow-md rounded text-sm z-10">
            <button
              className="block px-3 py-1 hover:bg-gray-100 w-full text-left"
              onClick={() => {
                setEditing(true);
                setShowMenu(false);
              }}
            >
              Edit
            </button>

            <button
              className="block px-3 py-1 hover:bg-gray-100 w-full text-left text-red-500"
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