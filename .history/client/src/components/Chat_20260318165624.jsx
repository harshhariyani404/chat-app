import { useEffect, useState } from 'react';
import { socket } from "../socket"
import Message from './Message';

const Chat = () => {
    const [username, setUsername] = useState("");
    const [message, setMessage] = useState("");
    const [messageList, setMessageList] = useState([]);

    useEffect(() => {
        socket.on("chat_history", (data) => {
            setMessageList(data);
        })

        socket.on("receive_message", (data) => {
            setMessageList((list) => [...list, data])
        })
    })


  return (
    <div>
      
    </div>
  );
}

export default Chat;
