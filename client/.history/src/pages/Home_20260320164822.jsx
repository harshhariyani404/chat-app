import { useEffect, useState } from "react";
import axios from "axios";
import { socket } from "../socket";
import Sidebar from "../components/Sidebar";
import Chat from "../components/Chat";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";

const Home = ({ user, setUser }) => {
    const [users, setUsers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [notifications, setNotifications] = useState([]);

    // 🔍 NEW: search state
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    // 🔥 Open Chat
    const openChat = async (user) => {
        try {
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

    // 🔍 Search users
    const handleSearch = async (query) => {
        setSearch(query);

        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            const res = await axios.get(
                `http://localhost:5000/api/users/search?query=${query}`
            );
            setSearchResults(res.data);
        } catch (err) {
            console.log("Search error:", err);
        }
    };

    // 🔁 Socket register + fetch chat users
    useEffect(() => {
        socket.emit("register", user._id);

        const handleConnect = () => {
            socket.emit("register", user._id);
        };

        socket.on("connect", handleConnect);

        const fetchUsers = async () => {
            try {
                const res = await axios.get(
                    `http://localhost:5000/api/users/chat-list/${user._id}`
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
    }, [user._id]);

    // 🔔 Notifications
    useEffect(() => {
        const handleNewNotification = (data) => {
            if (selected && selected._id === data.from) return;

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

        return () =>
            socket.off("new_notification", handleNewNotification);
    }, [selected]);

    // 🟢⚫ Real-time user status
    useEffect(() => {
        socket.on("user_online", (userId) => {
            setUsers((prev) =>
                prev.map((u) =>
                    u._id === userId ? { ...u, isOnline: true } : u
                )
            );
        });

        socket.on("nickname_updated", ({ userId, nickname }) => {
            setUsers((prev) =>
                prev.map((u) =>
                    u._id === userId
                        ? { ...u, displayName: nickname }
                        : u
                )
            );
        });

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

    // 🔥 Combine chat users + search
    const displayUsers = search ? searchResults : users;

    return (
        <div className="flex flex-col h-screen">
            <Navbar user={user} setUser={setUser} />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar
                    users={displayUsers}
                    setSelected={openChat}
                    notifications={notifications}
                    user={user}
                    search={search}
                    setSearch={handleSearch}
                />

                {selected ? (
                    <Chat user={user} selected={selected} setSelected={setSelected} />
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-white text-gray-500 text-lg">
                        Select a chat to start messaging
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;