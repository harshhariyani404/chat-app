import { useState } from "react";
import EditProfile from "./EditProfile";
import { getAvatarUrl } from "../lib/avatar";
import { clearSession } from "../lib/storage";
import { socket } from "../socket";

const Navbar = ({ user, setUser, onMenuToggle }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const avatarUrl = getAvatarUrl(user?.avatar);

  const handleLogout = () => {
    socket.removeAllListeners();
    socket.disconnect();
    clearSession();
    setUser(null);
  };

  return (
    <>
      <div className="relative z-40 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-white/60 bg-white/88 px-3 py-2 shadow-sm backdrop-blur-xl sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 md:hidden"
            aria-label="Toggle chats sidebar"
          >
            <span className="text-xl leading-none">☰</span>
          </button>

          <div className="min-w-0">
            <div className="truncate text-lg font-bold tracking-wide text-sky-500 sm:text-xl">
              ChatApp
            </div>
          </div>
        </div>

        <div className="relative shrink-0">
          <img
            src={
              avatarUrl
                ? avatarUrl
                : `https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName || user?.username || "default"
                }`
            }
            className="h-12 w-12 rounded-2xl object-cover ring-1 ring-slate-200"
            alt="profile"
            onClick={() => setShowMenu((prev) => !prev)}
          />


          {showMenu && (
            <div className="absolute right-0 top-14 z-30 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
              <button
                className="block min-h-[44px] w-full px-4 py-3 text-left text-sm font-medium transition hover:bg-gray-100"
                onClick={() => {
                  setShowMenu(false);
                  setShowEdit(true);
                }}
              >
                Profile Update
              </button>
              <button
                className="block min-h-[44px] w-full border-t px-4 py-3 text-left text-sm font-medium text-red-500 transition hover:bg-gray-100"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

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

export default Navbar;
