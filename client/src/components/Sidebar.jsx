import { useMemo } from "react";
import { getAvatarUrl } from "../lib/avatar";

const Sidebar = ({
  users,
  setSelected,
  notifications,
  user,
  search,
  setSearch,
  selectedId,
  isOpen,
  onClose,
}) => {
  const notificationMap = useMemo(() => {
    const map = {};
    notifications?.forEach((n) => {
      map[n.from] = (map[n.from] || 0) + 1;
    });
    return map;
  }, [notifications]);

  if (!user) return null;

  return (
    <aside
      className={`absolute inset-y-0 left-0 z-40 h-full w-full max-w-full shrink-0 transform border-r border-slate-200/80 bg-white/95 backdrop-blur-xl transition duration-300 md:static md:z-0 md:w-[300px] md:translate-x-0  md:border md:bg-white/78 lg:w-[320px] xl:w-[360px] ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:block`}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="border-b border-slate-200/80 px-4 py-4 sm:px-5 sm:py-5">
          <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">
                Conversations
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">Chats</h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg text-slate-700 transition hover:border-sky-200 hover:bg-sky-50"
              aria-label="Close chats sidebar"
            >
              ✕
            </button>
          </div>

          <div className="hidden md:block">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">
              Conversations
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Chats</h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Search people and continue your recent messages.
          </p>

          <input
            type="text"
            placeholder="Search users..."
            className="mt-4 min-h-[44px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
          {users?.map((u) => {
            if (!u) return null;

            const isActive = selectedId === u._id;
            const avatarUrl = getAvatarUrl(u.avatar);

            return (
              <button
                key={u._id}
                type="button"
                onClick={() => setSelected(u)}
                className={`mb-2 flex min-h-[72px] w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left shadow-sm transition ${
                  isActive
                    ? "border-sky-200 bg-sky-50/90 shadow-md"
                    : "border-transparent bg-white hover:-translate-y-0.5 hover:border-sky-100 hover:bg-sky-50/80 hover:shadow-md"
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={
                      avatarUrl
                        ? avatarUrl
                        : `https://api.dicebear.com/7.x/initials/svg?seed=${
                            u?.displayName || u?.username || "default"
                          }`
                    }
                    className="h-12 w-12 rounded-2xl object-cover ring-1 ring-slate-200"
                    alt="avatar"
                  />

                  {u?.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500"></span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-slate-900">
                    {u?.displayName || u?.username}
                  </div>
                  <div className="mt-0.5 truncate text-sm text-slate-500">
                    {u?.isOnline ? "Online now" : "Tap to open chat"}
                  </div>
                </div>

                {notificationMap[u._id] > 0 && (
                  <div className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-green-500 px-1.5 text-xs font-bold text-white shadow-sm">
                    {notificationMap[u._id]}
                  </div>
                )}
              </button>
            );
          })}

          {users?.length === 0 && (
            <div className="mt-10 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
              <p className="text-sm font-medium text-slate-600">No chats found</p>
              <p className="mt-1 text-sm text-slate-400">
                Start a conversation by searching for a user.
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
