import { useState } from "react";
import EditProfile from "./EditProfile";

const Navbar = ({ user, setUser }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <>
      <div className="h-16 bg-white border-b flex justify-between items-center px-4 shrink-0 shadow-sm z-20 relative">
        <div className="font-bold text-xl text-blue-500 tracking-wide">
          ChatApp
        </div>

        <div className="relative">
          <img
            src={
              u?.avatar
                ? u.avatar
                : `https://api.dicebear.com/7.x/initials/svg?seed=${u?.displayName || u?.username || "default"
                }`
            }
            alt="profile"
            className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
            onClick={() => setShowMenu(!showMenu)}
          />

          {showMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg overflow-hidden z-30">
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium"
                onClick={() => {
                  setShowMenu(false);
                  setShowEdit(true);
                }}
              >
                Profile Update
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500 text-sm font-medium border-t"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <EditProfile user={user} setUser={setUser} onClose={() => setShowEdit(false)} />
      )}
    </>
  );
};

export default Navbar;