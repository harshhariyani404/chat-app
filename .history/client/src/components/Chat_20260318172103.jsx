import { useEffect, useState } from 'react';
import { socket } from "../socket"
import Message from './Message';
import { use } from 'react';

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

        return () => {
            socket.off("chat_history");
            socket.off("receive_message");
        }
    },[])

    const sendMessage = () => {
        if(!message || !username) return

        socket.emit("send_message", {
            user: username,
            message,
        })
        setMessage("")
    }


  return (
    <div className='max-w-[500px] bg-gray-400'>
        <h2>Chat App</h2>

        <input 
            placeholder='Username'
            onChange={(e) => setUsername(e.target.value)}
        />

        <div style={{height: "300px", overflowY: "scroll"}}>
            {messageList.map((msg, index) => (
                <Message key={index} msg={msg} />
            ))}
        </div>

        <input 
            placeholder='Type message'
            value={message}
            onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Chat;
