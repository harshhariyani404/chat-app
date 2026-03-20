const Sidebar = ({ users, setSelected, notifications }) => {

  // Open chat + clear notifications
  const openChat = (user) => {
    setSelected(user);
  };

  return (
    <div className="w-1/4 bg-gray-100 border-r p-4 h-screen overflow-y-auto">
      
      {/* Header */}
      <h2 className="text-xl font-bold mb-4">💬 Chats</h2>

      {/* Users List */}
      {users.map((u) => {
        const count = notifications.filter(
          (n) => n.from === u._id
        ).length;

        return (
          <div
            key={u._id}
            onClick={() => openChat(u)}
            className="flex items-center justify-between p-3 mb-2 bg-white rounded-lg shadow cursor-pointer hover:bg-gray-200 transition"
          >
            {/* Username */}
            <span className="font-medium">{u.username}</span>

            {/* Notification Badge */}
            {count > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Sidebar;