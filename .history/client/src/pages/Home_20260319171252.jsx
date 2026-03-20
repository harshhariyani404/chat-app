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
    }, []);

    useEffect(() => {
        socket.on("new_notification", (data) => {
            setNotifications((prev) => [...prev, data]);
        });

        return () => socket.off("new_notification");
    }, []);

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