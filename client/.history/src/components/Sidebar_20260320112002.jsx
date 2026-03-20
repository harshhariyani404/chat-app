const Sidebar = ({ users, setSelected, notifications, user, setUser }) => {
  
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <div className="w-1/4 flex flex-col bg-gray-100 h-screen">

      {/* USERS */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="font-bold mb-3">Chats</h2>

        {users.map((u) => (
          <div
            key={u._id}
            onClick={() => setSelected(u)}
            className="p-2 bg-white mb-2 cursor-pointer rounded"
          >
            {u.username}
          </div>
        ))}
      </div>

      {/* 🔥 LOGGED USER SECTION */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center gap-3">
          
          <img
            src={`http://localhost:5000${user.avatar}`}
            className="w-10 h-10 rounded-full object-cover"
          />

          <div>
            <p className="font-semibold">{user.username}</p>
            <button
              className="text-sm text-blue-500"
              onClick={() => setShowEdit(true)}
            >
              Edit Profile
            </button>
          </div>
        </div>

        <button
          className="mt-3 w-full bg-red-500 text-white py-1 rounded"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;