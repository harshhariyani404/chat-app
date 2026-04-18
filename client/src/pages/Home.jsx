import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Chat from "../components/Chat";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import GroupChat from "./GroupChat";
import { api } from "../lib/api";
import { socket } from "../socket";

const Home = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [sidebarTab, setSidebarTab] = useState("chats");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupPickSearch, setGroupPickSearch] = useState("");
  const [groupPickResults, setGroupPickResults] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [meetingLinkToCopy, setMeetingLinkToCopy] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get(`/users/chat-list/${user._id}`);
      setUsers(res.data);
    } catch {
      toast.error("Unable to load chats right now.");
    }
  }, [user._id]);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.get("/groups");
      setGroups(res.data);
    } catch {
      toast.error("Unable to load groups.");
    }
  }, []);

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await api.get("/meetings");
      setMeetings(res.data);
    } catch {
      /* optional */
    }
  }, []);

  const openChat = async (chatUser) => {
    setSidebarTab("chats");
    try {
      const res = await api.get(`/users/status/${chatUser._id}`);

      const updatedUser = {
        ...chatUser,
        isOnline: res.data.isOnline,
        lastSeen: res.data.lastSeen,
      };

      setSelected(updatedUser);
      setSelectedGroup(null);
      setIsSidebarOpen(false);
      setNotifications((prev) => prev.filter((n) => n.from !== chatUser._id));
    } catch {
      setSelected(chatUser);
      setSelectedGroup(null);
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

  const handleGroupPickSearch = async (query) => {
    setGroupPickSearch(query);

    if (!query.trim()) {
      setGroupPickResults([]);
      return;
    }

    try {
      const res = await api.get("/users/search", { params: { query } });
      setGroupPickResults(res.data.filter((u) => u._id !== user._id));
    } catch {
      setGroupPickResults([]);
    }
  };

  const addGroupMember = (u) => {
    if (groupMembers.some((m) => m._id === u._id)) {
      return;
    }

    setGroupMembers((prev) => [...prev, u]);
    setGroupPickSearch("");
    setGroupPickResults([]);
  };

  const submitCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Enter a group name");
      return;
    }

    const memberIds = groupMembers.map((m) => m._id);

    if (memberIds.length === 0) {
      toast.error("Add at least one member");
      return;
    }

    try {
      const res = await api.post("/groups", {
        name: groupName.trim(),
        memberIds,
      });

      setGroups((prev) => [res.data, ...prev]);
      setShowCreateGroup(false);
      setGroupName("");
      setGroupMembers([]);
      setSelectedGroup(res.data);
      setSidebarTab("groups");
      toast.success("Group created");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create group");
    }
  };

  const handleCreateMeeting = async () => {
    try {
      const res = await api.post("/meetings");
      const link = `${window.location.origin}/meeting/${res.data.meetingId}`;
      setMeetingLinkToCopy(link);
      setMeetings((prev) => [res.data, ...prev]);

      try {
        await navigator.clipboard.writeText(link);
        toast.success("Meeting link copied to clipboard");
      } catch {
        toast("Meeting created — use Copy link in the sidebar");
      }

      navigate(`/meeting/${res.data.meetingId}`);
    } catch {
      toast.error("Could not create meeting");
    }
  };

  const copyMeetingLink = async () => {
    if (!meetingLinkToCopy) {
      return;
    }

    try {
      await navigator.clipboard.writeText(meetingLinkToCopy);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
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

      setSidebarTab("chats");

      if (caller) {
        setSelected((prev) => (prev?._id === caller._id ? prev : caller));
        setSelectedGroup(null);
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
          setSelectedGroup(null);
          setIsSidebarOpen(false);
        } catch {
          setSelected({ _id: data.from, username: "Unknown Caller" });
          setSelectedGroup(null);
          setIsSidebarOpen(false);
        }
      }
    };

    socket.on("connect", handleConnect);
    socket.on("incoming-call", handleIncomingCall);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("incoming-call", handleIncomingCall);
    };
  }, [user._id]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await fetchUsers();
      if (cancelled) return;
      await fetchGroups();
      if (cancelled) return;
      await fetchMeetings();
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchUsers, fetchGroups, fetchMeetings]);

  useEffect(() => {
    const handleNewNotification = (data) => {
      if (data.isGroup) {
        if (selectedGroup && data.groupId === selectedGroup._id) {
          return;
        }

        toast(`${data.username}: ${data.message}`, {
          duration: 5000,
          style: { background: "#333", color: "#fff" },
        });
        return;
      }

      if (selected && selected._id === data.from) return;

      toast(`${data.username}: ${data.message}`, {
        duration: 5000,
        style: { background: "#333", color: "#fff" },
      });

      setNotifications((prev) => [...prev, data]);
    };

    socket.on("new_notification", handleNewNotification);

    return () => socket.off("new_notification", handleNewNotification);
  }, [selected, selectedGroup]);

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

  const selectGroup = (g) => {
    setSelectedGroup(g);
    setSelected(null);
    setIsSidebarOpen(false);
  };

  const mainEmpty = () => (
    <div className="relative mx-0 flex flex-1 flex-col items-center justify-center overflow-hidden border border-slate-200/80 bg-white/90 px-6 text-center shadow-panel backdrop-blur-xl md:mx-4 md:mt-4 md:rounded-3xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_50%)]" />
      <div className="relative max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
          <svg className="h-8 w-8 text-white opacity-95" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-xl font-bold tracking-tight text-slate-900">
          {sidebarTab === "chats" && "Pick a conversation"}
          {sidebarTab === "groups" && "Open or create a group"}
          {sidebarTab === "meetings" && "Meetings & shareable links"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {sidebarTab === "chats" && "Choose someone from the sidebar — text, files, voice and video calls."}
          {sidebarTab === "groups" && "Create a group, add members, and chat together in real time."}
          {sidebarTab === "meetings" && "Host a room: guests connect to you in a star layout for stable video."}
        </p>
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500 md:hidden"
        >
          Open menu
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar
        user={user}
        setUser={setUser}
        onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div className="relative flex flex-1 gap-2 overflow-hidden px-0 pb-0 md:px-4 md:pb-4">
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
          sidebarTab={sidebarTab}
          setSidebarTab={setSidebarTab}
          groups={groups}
          meetings={meetings}
          selectedGroupId={selectedGroup?._id}
          onSelectGroup={selectGroup}
          onOpenCreateGroup={() => setShowCreateGroup(true)}
          onCreateMeeting={handleCreateMeeting}
          meetingLinkToCopy={meetingLinkToCopy}
          onCopyMeetingLink={copyMeetingLink}
        />

        {sidebarTab === "groups" && selectedGroup ? (
          <GroupChat
            user={user}
            group={selectedGroup}
            onBack={() => setSelectedGroup(null)}
            onGroupUpdated={(g) => {
              setSelectedGroup(g);
              setGroups((prev) => prev.map((x) => (String(x._id) === String(g._id) ? g : x)));
            }}
            onGroupDeleted={(id) => {
              setSelectedGroup(null);
              setGroups((prev) => prev.filter((g) => String(g._id) !== String(id)));
            }}
          />
        ) : sidebarTab === "chats" && selected ? (
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
          mainEmpty()
        )}
      </div>

      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200/90 bg-white p-6 shadow-panel">
            <h3 className="text-lg font-bold tracking-tight text-slate-900">New group</h3>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Group name
              <input
                type="text"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Team chat"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Add people
              <input
                type="text"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
                value={groupPickSearch}
                onChange={(e) => handleGroupPickSearch(e.target.value)}
                placeholder="Search users…"
              />
            </label>

            {groupPickResults.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50">
                {groupPickResults.map((u) => (
                  <button
                    key={u._id}
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white"
                    onClick={() => addGroupMember(u)}
                  >
                    {u.username}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {groupMembers.map((m) => (
                <span
                  key={m._id}
                  className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-900"
                >
                  {m.username}
                  <button
                    type="button"
                    className="text-sky-600"
                    onClick={() =>
                      setGroupMembers((prev) => prev.filter((x) => x._id !== m._id))
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                onClick={() => setShowCreateGroup(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-500 hover:to-violet-500"
                onClick={() => void submitCreateGroup()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
