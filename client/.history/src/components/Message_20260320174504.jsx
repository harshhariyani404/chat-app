import { useState, useRef, useEffect } from "react";
import { socket } from "../socket";

const Message = ({ msg, myId }) => {
  const isMe = msg.from === myId;

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(msg.message);
  const [showMenu, setShowMenu] = useState(false);

  const menuRef = useRef(null);

  // 🔥 Hide menu on outside click
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
        ref={menuRef}
        className={`relative p-2 m-1 rounded max-w-xs cursor-pointer ${
          isMe ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
        }`}
        onClick={() => isMe && setShowMenu(!showMenu)}
      >
        {/* 🔥 MENU */}
        {showMenu && isMe && !editing && (
          <div className="absolute right-0 bottom-full mt-1 bg-white shadow-md rounded text-sm text-gray-800">
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

        {/* MESSAGE CONTENT */}
        {editing ? (
          <div className="flex gap-2">
            <input
              className="border p-1 text-sm text-black rounded outline-none"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              className={`${isMe ? "text-green-300" : "text-green-600"} font-bold text-sm`}
              onClick={handleEdit}
            >
              done
            </button>
          </div>
        ) : (
          <>
            <p>{msg.message}</p>
            {/* {msg.isEdited && (
              <span className={`text-xs ml-1 ${isMe ? "text-blue-200" : "text-gray-500"}`}>
                (edited)
              </span>
            )} */}
          </>
        )}

      </div>
    </div>
  );
};

export default Message;
