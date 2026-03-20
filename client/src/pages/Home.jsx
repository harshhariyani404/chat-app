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

  const openChat = async (targetUser) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/users/status/${targetUser._id}`
      );

      const updatedUser = {
        ...targetUser,
        isOnline: res.data.isOnline,
        lastSeen: res.data.lastSeen,
      };

      setSelected(updatedUser);
      setNotifications((prev) => prev.filter((n) => n.from !== targetUser._id));
    } catch (err) {
      console.log("Error fetching status", err);
      setSelected(targetUser);
    }
  };

  useEffect(() => {
    socket.emit("register", user._id);

    const handleConnect = () => {
      socket.emit("register", user._id);
    };

    socket.on("connect", handleConnect);

    const fetchUsers = async () => {
      try {
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
  }, [user._id]);

  useEffect(() => {
    const handleNewNotification = (data) => {
      if (selected && selected._id === data.from) return;

      toast(`${data.username}: ${data.message}`, {
        duration: 4500,
        style: {
          background: "rgba(23, 49, 62, 0.96)",
          color: "#fffaf5",
          borderRadius: "18px",
          padding: "14px 16px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 14px 32px rgba(19, 37, 47, 0.28)",
        },
        iconTheme: {
          primary: "#f26b5b",
          secondary: "#fffaf5",
        },
      });

      setNotifications((prev) => [...prev, data]);
    };

    socket.on("new_notification", handleNewNotification);

    return () => socket.off("new_notification", handleNewNotification);
  }, [selected]);

  useEffect(() => {
    socket.on("user_online", (userId) => {
      setUsers((prev) =>
        prev.map((item) =>
          item._id === userId ? { ...item, isOnline: true } : item
        )
      );
    });

    socket.on("user_offline", ({ userId, lastSeen }) => {
      setUsers((prev) =>
        prev.map((item) =>
          item._id === userId ? { ...item, isOnline: false, lastSeen } : item
        )
      );
    });

    return () => {
      socket.off("user_online");
      socket.off("user_offline");
    };
  }, []);

  return (
    <div className="app-shell">
      <div className="ambient-orb left-[-7rem] top-[8%] h-72 w-72 bg-[#f26b5b]/15" />
      <div className="ambient-orb bottom-[2%] right-[-6rem] h-80 w-80 bg-[#2f8f83]/20" />

      <div className="chat-layout">
        <div className="chat-frame">
          <div
            className={`h-full w-full md:flex md:w-[360px] md:min-w-[360px] lg:w-[390px] lg:min-w-[390px] ${
              selected ? "hidden md:flex" : "flex"
            }`}
          >
            <Sidebar
              users={users}
              setSelected={openChat}
              notifications={notifications}
              user={user}
              setUser={setUser}
              selected={selected}
            />
          </div>

          <div className={`flex-1 ${selected ? "flex" : "hidden md:flex"}`}>
            {selected ? (
              <Chat
                user={user}
                selected={selected}
                onBack={() => setSelected(null)}
              />
            ) : (
              <div className="chat-panel items-center justify-center px-6 text-center">
                <div className="floating-card max-w-xl rounded-[32px] border border-white/60 bg-white/60 px-8 py-10 shadow-[0_20px_60px_rgba(20,44,58,0.12)] backdrop-blur-sm">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#17313e] text-2xl text-white shadow-lg">
                    C
                  </div>
                  <h2 className="text-2xl font-semibold sm:text-3xl">
                    Choose a conversation to start messaging
                  </h2>
                  <p className="mt-4 text-sm leading-7 sm:text-base" style={{ color: "var(--text-soft)" }}>
                    Your refreshed workspace is ready. Pick someone from the sidebar
                    and the chat panel will open with a mobile-friendly layout.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
