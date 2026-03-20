const Message = ({ msg, myId }) => {
  const isMe = msg.from === myId;

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`p-2 m-1 rounded max-w-xs whitespace-pre-wrap break-words ${
          isMe
            ? "bg-blue-500 text-white"
            : "bg-gray-300 text-black"
        }`}
      >
        {msg.message}
      </div>
    </div>
  );
};

export default Message;