const Sidebar = ({ users, setSelected, notifications, user, search, setSearch }) => {

  if (!user) return null;

  return (
    <div className="w-1/4 flex flex-col bg-gray-100 h-full border-r z-10">

      {/* USERS */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="font-bold mb-3">Chats</h2>

        {/* SEARCH BAR */}
        <input
          type="text"
          placeholder="Search users..."
          className="w-full p-2 mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {users.map((u) => (
          <div
            key={u._id}
            onClick={() => setSelected(u)}
            className="flex items-center gap-3 p-2 bg-white mb-2 cursor-pointer rounded hover:bg-gray-200 shadow-sm"
          >
            <div className="relative">
              <img
                src={
                  u?.avatar
                    ? (u.avatar.startsWith('http') ? u.avatar : `http://localhost:5000${u.avatar}`)
                    : `https://api.dicebear.com/7.x/initials/svg?seed=${u?.username || 'default'}`
                }
                className="w-10 h-10 rounded-full object-cover"
              />

              {/* ðŸŸ¢ ONLINE DOT */}
              {u.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              )}
            </div>

            <div className="font-medium flex-1">{u.username}</div>

            {/* NOTIFICATION BADGE */}
            {notifications?.filter((n) => n.from === u._id).length > 0 && (
              <div className="bg-red-500 text-white text-xs font-bold min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full">
                {notifications.filter((n) => n.from === u._id).length}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
