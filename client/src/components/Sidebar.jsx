import { useMemo } from "react";
import { getAvatarUrl } from "../lib/avatar";

const tabs = [
  { id: "chats", label: "Chats" },
  { id: "groups", label: "Groups" },
  { id: "meetings", label: "Meetings" },
];

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
  sidebarTab,
  setSidebarTab,
  groups = [],
  meetings = [],
  selectedGroupId,
  onSelectGroup,
  onOpenCreateGroup,
  onCreateMeeting,
  meetingLinkToCopy,
  onCopyMeetingLink,
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
      className={`absolute inset-y-0 left-0 z-40 h-full w-full max-w-full shrink-0 transform border-r border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 shadow-[4px_0_24px_-8px_rgba(15,23,42,0.08)] backdrop-blur-xl transition duration-300 md:static md:z-0 md:w-[300px] md:translate-x-0 lg:w-[320px] xl:w-[360px] ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:block`}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="border-b border-slate-200/80 px-3 py-3 sm:px-5 sm:py-4">
          <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">Navigate</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Connect</h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              aria-label="Close sidebar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="hidden md:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">Navigate</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Inbox</h2>
          </div>

          <div className="mt-4 flex gap-1 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSidebarTab(t.id)}
                className={`flex-1 rounded-xl px-2 py-2.5 text-center text-xs font-semibold transition sm:text-sm ${
                  sidebarTab === t.id
                    ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {sidebarTab === "chats" && (
            <>
              <p className="mt-4 text-sm leading-relaxed text-slate-500">
                Find people and open a direct conversation.
              </p>
              <input
                type="search"
                placeholder="Search by username…"
                className="mt-3 min-h-[44px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/15"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </>
          )}

          {sidebarTab === "groups" && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-slate-500">Collaborate with your team.</p>
              <button
                type="button"
                onClick={onOpenCreateGroup}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500"
              >
                New group
              </button>
            </div>
          )}

          {sidebarTab === "meetings" && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-slate-500">Star-topology video rooms.</p>
              <button
                type="button"
                onClick={onCreateMeeting}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-500 hover:to-teal-500"
              >
                New meeting
              </button>
              {meetingLinkToCopy && (
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <p className="text-xs font-semibold text-slate-600">Last created link</p>
                  <p className="mt-1 break-all font-mono text-[10px] leading-relaxed text-slate-700">{meetingLinkToCopy}</p>
                  <button
                    type="button"
                    onClick={onCopyMeetingLink}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100"
                  >
                    Copy again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
          {sidebarTab === "chats" &&
            users?.map((u) => {
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
                      ? "border-indigo-200 bg-indigo-50/90 shadow-md ring-1 ring-indigo-100"
                      : "border-transparent bg-white hover:-translate-y-0.5 hover:border-indigo-100 hover:bg-white hover:shadow-md"
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
                    <div className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 px-1.5 text-xs font-bold text-white shadow-sm">
                      {notificationMap[u._id]}
                    </div>
                  )}
                </button>
              );
            })}

          {sidebarTab === "chats" && users?.length === 0 && (
            <div className="mt-10 rounded-3xl border border-dashed border-slate-200/90 bg-white/60 px-5 py-8 text-center">
              <p className="text-sm font-semibold text-slate-700">No conversations yet</p>
              <p className="mt-1 text-sm text-slate-500">Search above to find someone.</p>
            </div>
          )}

          {sidebarTab === "groups" &&
            groups?.map((g) => {
              const isActive = selectedGroupId === g._id;
              return (
                <button
                  key={g._id}
                  type="button"
                  onClick={() => onSelectGroup(g)}
                  className={`mb-2 flex min-h-[64px] w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                    isActive
                      ? "border-violet-300 bg-violet-50 shadow-md ring-1 ring-violet-100"
                      : "border-transparent bg-white hover:border-violet-100 hover:bg-violet-50/50"
                  }`}
                >
                  <img
                    src={
                      getAvatarUrl(g.avatar) ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(g.name || "G")}`
                    }
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-slate-200/80"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-slate-900">{g.name}</div>
                    <div className="text-xs text-slate-500">{g.members?.length || 0} members</div>
                  </div>
                </button>
              );
            })}

          {sidebarTab === "groups" && groups?.length === 0 && (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No groups yet. Create one to chat with multiple people.
            </div>
          )}

          {sidebarTab === "meetings" && (
            <div className="space-y-2">
              {meetings?.map((m) => (
                <div
                  key={m._id}
                  className="rounded-2xl border border-slate-200/90 bg-white px-3 py-3 text-sm shadow-sm"
                >
                  <p className="font-mono text-[11px] font-medium text-slate-800">{m.meetingId}</p>
                  <p className="mt-1 text-xs text-slate-500">Host · {m.hostId?.username || "—"}</p>
                </div>
              ))}
              {meetings?.length === 0 && (
                <p className="mt-4 text-center text-sm text-slate-500">
                  No meetings yet. Create one to get a shareable link.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
