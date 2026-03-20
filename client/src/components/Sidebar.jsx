import { useState } from "react";
import EditProfile from "./EditProfile";

const Sidebar = ({
  users,
  setSelected,
  notifications,
  user,
  setUser,
  selected,
}) => {
  const [showEdit, setShowEdit] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  const getAvatar = (target) =>
    target?.avatar
      ? target.avatar.startsWith("http")
        ? target.avatar
        : `http://localhost:5000${target.avatar}`
      : `https://api.dicebear.com/7.x/initials/svg?seed=${target?.username || "default"}`;

  return (
    <>
      <aside className="sidebar-panel">
        <div className="border-b border-slate-700/10 px-5 pb-5 pt-6 sm:px-6">
          <div className="soft-panel rounded-[28px] p-4">
            <div className="flex items-center gap-3">
              <img
                src={getAvatar(user)}
                alt={user.username}
                className="soft-ring h-14 w-14 rounded-2xl object-cover"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold">{user.username}</p>
                <p className="text-sm" style={{ color: "var(--text-soft)" }}>
                  Ready to chat
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                className="secondary-button flex-1"
                onClick={() => setShowEdit(true)}
              >
                Edit profile
              </button>
              <button className="primary-button flex-1" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 pb-3 pt-5 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2f8f83]">
              Inbox
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Chats</h2>
          </div>
          <div className="rounded-full bg-[#17313e] px-3 py-1 text-sm font-semibold text-white">
            {users.length}
          </div>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-4 pb-5 sm:px-5">
          {users.map((target) => {
            const unreadCount = notifications.filter(
              (item) => item.from === target._id
            ).length;
            const isActive = selected?._id === target._id;

            return (
              <button
                key={target._id}
                type="button"
                onClick={() => setSelected(target)}
                className={`mb-3 flex w-full items-center gap-3 rounded-[24px] border px-4 py-3 text-left transition duration-200 ${
                  isActive
                    ? "border-[#f26b5b]/30 bg-[#fff7f3] shadow-[0_14px_30px_rgba(242,107,91,0.12)]"
                    : "border-white/60 bg-white/70 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_28px_rgba(19,37,47,0.08)]"
                }`}
              >
                <div className="relative">
                  <img
                    src={getAvatar(target)}
                    alt={target.username}
                    className="h-12 w-12 rounded-2xl object-cover"
                  />
                  {target.isOnline && (
                    <span className="status-dot absolute -bottom-1 -right-1" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-semibold">{target.username}</p>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-[#f26b5b] px-2 py-0.5 text-xs font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm" style={{ color: "var(--text-soft)" }}>
                    {target.isOnline ? "Online now" : "Tap to open conversation"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {showEdit && (
        <EditProfile
          user={user}
          setUser={setUser}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
