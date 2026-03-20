import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  const sendMessage = () => {
    if (message !== "" && username !== "") {
      const messageData = {
        user: username,
        message: message,
        time: new Date().toLocaleTimeString(),
      };

      socket.emit("send_message", messageData);
      setMessage("");
    }
  };

  useEffect(() => {
    socket.on("chat_history", (data) => {
      setMessageList(data);
    });

    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Vite Chat App 🚀</h2>

      <input
        placeholder="Enter username"
        onChange={(e) => setUsername(e.target.value)}
      />

      <div style={{ margin: "20px" }}>
        {messageList.map((msg, index) => (
          <div key={index}>
            <strong>{msg.user}</strong>: {msg.message}
            <br />
            <small>{msg.time}</small>
          </div>
        ))}
      </div>

      <input
        value={message}
        placeholder="Type message"
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;