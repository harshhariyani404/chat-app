import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Chat from "../components/Chat";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { api } from "../lib/api";
import { socket } from "../socket";

const Home = ({ user, setUser }) => {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [incomingCallData, setIncomingCallData] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get(`/users/chat-list/${user._id}`);
      setUsers(res.data);
    } catch {
      toast.error("Unable to load chats right now.");
    }
  }, [user._id]);

  const openChat = async (chatUser) => {
    try {
      const res = await api.get(`/users/status/${chatUser._id}`);

      const updatedUser = {
        ...chatUser,
        isOnline: res.data.isOnline,
        lastSeen: res.data.lastSeen,
      };

      setSelected(updatedUser);
      setIsSidebarOpen(false);
      setNotifications((prev) => prev.filter((n) => n.from !== chatUser._id));
    } catch {
      setSelected(chatUser);
      setIsSidebarOpen(false);
    }
  };

  const handleSearch = async (query) => {
    setSearch(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await api.get("/users/search", {
        params: { query },
      });
      setSearchResults(res.data);
    } catch {
      setSearchResults([]);
    }
  };

  useEffect(() => {
    socket.connect();
    socket.emit("register", user._id);

    const handleConnect = () => {
      socket.emit("register", user._id);
    };

    const handleIncomingCall = async (data) => {
      setIncomingCallData(data);

      let caller;
      setUsers((prev) => {
        caller = prev.find((u) => u._id === data.from);
        return prev;
      });

      // Automatically switch to the incoming caller's chat
      if (caller) {
        setSelected((prev) => (prev?._id === caller._id ? prev : caller));
        setIsSidebarOpen(false);
      } else {
        try {
          const listRes = await api.get(`/users/chat-list/${user._id}`);
          setUsers(listRes.data);
          const found = listRes.data.find((u) => u._id === data.from);
          if (found) {
            setSelected(found);
          } else {
            setSelected({ _id: data.from, username: "Unknown Caller" });
          }
          setIsSidebarOpen(false);
        } catch {
          setSelected({ _id: data.from, username: "Unknown Caller" });
          setIsSidebarOpen(false);
        }
      }
    };

    socket.on("connect", handleConnect);
    socket.on("incoming-call", handleIncomingCall);

    const loadUsers = async () => {
      await fetchUsers();
    };

    void loadUsers();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("incoming-call", handleIncomingCall);
      socket.disconnect();
    };
  }, [fetchUsers, user._id]);

  useEffect(() => {
    const handleNewNotification = (data) => {
      if (selected && selected._id === data.from) return;

      toast(`${data.username}: ${data.message}`, {
        duration: 5000,
        style: { background: "#333", color: "#fff" },
      });

      setNotifications((prev) => [...prev, data]);
    };

    socket.on("new_notification", handleNewNotification);

    return () => socket.off("new_notification", handleNewNotification);
  }, [selected]);

  useEffect(() => {
    const handleUserOnline = (userId) => {
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isOnline: true } : u))
      );
      setSelected((prev) =>
        prev && prev._id === userId ? { ...prev, isOnline: true } : prev
      );
    };

    const handleUserOffline = ({ userId, lastSeen }) => {
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isOnline: false, lastSeen } : u
        )
      );
      setSelected((prev) =>
        prev && prev._id === userId
          ? { ...prev, isOnline: false, lastSeen }
          : prev
      );
    };

    const handleNicknameUpdated = ({ userId, nickname }) => {
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, displayName: nickname } : u
        )
      );
      setSelected((prev) =>
        prev && prev._id === userId
          ? { ...prev, displayName: nickname }
          : prev
      );
    };

    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);
    socket.on("nickname_updated", handleNicknameUpdated);

    return () => {
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
      socket.off("nickname_updated", handleNicknameUpdated);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const displayUsers = search ? searchResults : users;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-transparent">
      <Navbar
        user={user}
        setUser={setUser}
        onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div className="relative gap-2 flex flex-1 overflow-hidden px-0 pb-0 md:px-4 md:pb-4">
        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            className="absolute inset-0 z-30 bg-slate-950/30 backdrop-blur-[1px] md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <Sidebar
          users={displayUsers}
          setSelected={openChat}
          notifications={notifications}
          user={user}
          search={search}
          setSearch={handleSearch}
          selectedId={selected?._id}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {selected ? (
          <Chat
            user={user}
            selected={selected}
            setSelected={setSelected}
            setUsers={setUsers}
            fetchUsers={fetchUsers}
            incomingCallData={incomingCallData}
            setIncomingCallData={setIncomingCallData}
          />
        ) : (
          <div className="mx-0 flex flex-1 items-center justify-center border-y border-white/60 bg-white/72 px-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl md:mx-4 md:mt-4 md:rounded-[28px] md:border">
            <div>
              <p className="text-xl font-semibold text-slate-800">
                Select a chat to start messaging
              </p>
              <p className="mt-2 text-sm text-slate-500">
                You can send text, images, videos, PDFs, and other files here.
              </p>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600 md:hidden"
              >
                Open chats
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
