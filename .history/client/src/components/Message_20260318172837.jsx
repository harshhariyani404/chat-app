const Message = ({ msg, username }) => {
  const isMe = msg.user === username;

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs px-3 py-2 rounded-lg shadow text-sm ${
          isMe
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-300 text-black rounded-bl-none"
        }`}
      >
        {!isMe && (
          <p className="text-xs font-semibold mb-1">{msg.user}</p>
        )}
        <p>{msg.message}</p>
        <p className="text-[10px] mt-1 text-right opacity-70">
          {msg.createdAt
            ? new Date(msg.createdAt).toLocaleTimeString()
            : ""}
        </p>
      </div>
    </div>
  );
};

export default Message;