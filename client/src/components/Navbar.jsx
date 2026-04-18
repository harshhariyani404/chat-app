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
      <header className="relative z-40 flex min-h-[4.25rem] shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-3 py-2 shadow-soft backdrop-blur-xl sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 md:hidden"
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/25">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Connect</p>
              <p className="hidden text-xs font-medium text-slate-500 sm:block">Messages · Calls · Meetings</p>
            </div>
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            className="rounded-2xl ring-2 ring-white ring-offset-2 ring-offset-slate-50 transition hover:ring-indigo-200"
            onClick={() => setShowMenu((prev) => !prev)}
            aria-label="Account menu"
          >
            <img
              src={
                avatarUrl
                  ? avatarUrl
                  : `https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName || user?.username || "default"}`
              }
              className="h-11 w-11 rounded-2xl object-cover"
              alt=""
            />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-[3.25rem] z-30 w-52 overflow-hidden rounded-2xl border border-slate-200/90 bg-white py-1 shadow-panel">
              <button
                type="button"
                className="block min-h-[44px] w-full px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => {
                  setShowMenu(false);
                  setShowEdit(true);
                }}
              >
                Edit profile
              </button>
              <button
                type="button"
                className="block min-h-[44px] w-full border-t border-slate-100 px-4 py-3 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      {showEdit && (
        <EditProfile user={user} setUser={setUser} onClose={() => setShowEdit(false)} />
      )}
    </>
  );
};

export default Navbar;
