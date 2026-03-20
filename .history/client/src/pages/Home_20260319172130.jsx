import { useEffect, useState } from "react";
import axios from "axios";
import { socket } from "../socket";
import Sidebar from "../components/Sidebar";
import Chat from "../components/Chat";

const Home = ({ user }) => {
    const [users, setUsers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const openChat = (user) => {
        setSelected(user);

        // Remove notifications for this user
        setNotifications((prev) =>
            prev.filter((n) => n.from !== user._id)
        );
    };

    useEffect(() => {
        socket.emit("register", user._id);
        
        // Re-register if the socket connection drops and reconnects
        const handleConnect = () => {
            socket.emit("register", user._id);
        };
        socket.on("connect", handleConnect);

        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(
                    `http://localhost:5000/api/users?myId=${user._id}`
                );
                setUsers(res.data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUsers();
        
        return () => {
            socket.off("connect", handleConnect);
        };
    }, [user._id]); // Add user._id to dependency array

    useEffect(() => {
        const handleNewNotification = (data) => {
            console.log("New notification:", data);
            
            // Ignore notification if the user is already actively chatting with the sender
            if (selected && selected._id === data.from) return;
            
            setNotifications((prev) => [...prev, data]);
        };
        
        socket.on("new_notification", handleNewNotification);

        return () => socket.off("new_notification", handleNewNotification);
    }, [selected]); // Add selected to dependency array to get the latest active chat

    return (
        <div className="flex h-screen">
            <Sidebar
                users={users}
                setSelected={openChat}
                notifications={notifications}
            />

            {selected && <Chat user={user} selected={selected} />}
        </div>
    );
};

export default Home;