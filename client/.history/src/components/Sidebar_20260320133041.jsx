import { useState } from "react";
import EditProfile from "./EditProfile";

const Sidebar = ({ users, setSelected, notifications, user, setUser }) => {

  if (!user) return null;

  const [showEdit, setShowEdit] = useState(false);

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

      {/* ðŸ”¥ LOGGED USER SECTION */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center gap-3">

          <img
            src={
              user?.avatar
                ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`)
                : `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || 'default'}`
            }
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
          className="mt-3 w-full bg-red-500 text-white py-1 rounded hover:bg-red-600"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {/* ðŸ”¥ EDIT PROFILE MODAL */}
      {showEdit && (
        <EditProfile
          user={user}
          setUser={setUser}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
};

export default Sidebar;
