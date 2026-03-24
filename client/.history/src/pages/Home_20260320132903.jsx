import { useEffect, useState } from "react";
import axios from "axios";
import { socket } from "../socket";
import Sidebar from "../components/Sidebar";
import Chat from "../components/Chat";
import toast from "react-hot-toast";

const Home = ({ user, setUser }) => {
    const [users, setUsers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const openChat = async (user) => {
        try {
            // fetch latest status
            const res = await axios.get(
                `http://localhost:5000/api/users/status/${user._id}`
            );

            const updatedUser = {
                ...user,
                isOnline: res.data.isOnline,
                lastSeen: res.data.lastSeen,
            };

            setSelected(updatedUser);

            // remove notifications
            setNotifications((prev) =>
                prev.filter((n) => n.from !== user._id)
            );

        } catch (err) {
            console.log("Error fetching status", err);
            setSelected(user);
        }
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

            // â— Skip if already chatting
            if (selected && selected._id === data.from) return;

            // âœ… SHOW POPUP
            toast(`${data.username}: ${data.message}`, {
                duration: 5000,
                style: {
                    background: "#333",
                    color: "#fff",
                },
            });

            setNotifications((prev) => [...prev, data]);
        };

        socket.on("new_notification", handleNewNotification);

        return () => socket.off("new_notification", handleNewNotification);
    }, [selected]);

    useEffect(() => {
        // ðŸŸ¢ User comes online
        socket.on("user_online", (userId) => {
            setUsers((prev) =>
                prev.map((u) =>
                    u._id === userId ? { ...u, isOnline: true } : u
                )
            );
        });

        // âš« User goes offline
        socket.on("user_offline", ({ userId, lastSeen }) => {
            setUsers((prev) =>
                prev.map((u) =>
                    u._id === userId
                        ? { ...u, isOnline: false, lastSeen }
                        : u
                )
            );
        });

        return () => {
            socket.off("user_online");
            socket.off("user_offline");
        };
    }, []);


    return (
        <div className="flex h-screen">
            <Sidebar
                users={users}
                setSelected={openChat}
                notifications={notifications}
                user={user}
                setUser={setUser}
            />

            {selected ? (
                <Chat user={user} selected={selected} />
            ) : (
                <div className="flex-1 flex items-center justify-center bg-white text-gray-500 text-lg">
                    Select a chat to start messaging
                </div>
            )}
        </div>
    );
};

export default Home;
