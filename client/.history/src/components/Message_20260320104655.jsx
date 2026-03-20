import { useState } from "react";
import { socket } from "../socket";

const Message = ({ msg, myId }) => {
  const isMe = msg.from === myId;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(msg.message);

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
      <div className="p-2 m-1 bg-gray-200 rounded relative">

        {editing ? (
          <>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button onClick={handleEdit}>Save</button>
          </>
        ) : (
          <>
            <p>{msg.message}</p>
            {msg.isEdited && <span className="text-xs">(edited)</span>}
          </>
        )}

        {/* Show options only for own message */}
        {isMe && !editing && (
          <div className="text-xs mt-1 flex gap-2">
            <button onClick={() => setEditing(true)}>✏️</button>
            <button onClick={handleDelete}>🗑️</button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Message;