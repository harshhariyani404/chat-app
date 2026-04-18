import { getAvatarUrl } from "../lib/avatar";

const MeetingParticipantList = ({ meeting, currentUserId, maxParticipants, onClose }) => {
  const host = meeting?.hostId;
  const hostId = host?._id || host;

  const rows = [];

  if (host) {
    rows.push({
      id: String(hostId),
      username: host.username || "Host",
      avatar: host.avatar,
      isHost: true,
    });
  }

  const seen = new Set(rows.map((r) => r.id));

  (meeting?.participants || []).forEach((p) => {
    const id = String(p._id || p);
    if (seen.has(id)) return;
    seen.add(id);
    rows.push({
      id,
      username: p.username || "Member",
      avatar: p.avatar,
      isHost: false,
    });
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 lg:px-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">People</p>
          <p className="text-sm font-semibold text-white">
            {rows.length}
            <span className="font-normal text-slate-400"> / {maxParticipants} max</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close list"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto px-2 py-2">
        {rows.map((row) => {
          const url = getAvatarUrl(row.avatar);
          const isYou = row.id === String(currentUserId);

          return (
            <li
              key={row.id}
              className="mb-1.5 flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-white/5"
            >
              <img
                src={
                  url ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.username)}`
                }
                alt=""
                className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {row.username}
                  {isYou ? <span className="ml-1 text-xs font-normal text-slate-400">(you)</span> : null}
                </p>
                {row.isHost && (
                  <span className="inline-block rounded-md bg-indigo-500/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-200">
                    Host
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="border-t border-white/10 px-3 py-3 text-[11px] leading-relaxed text-slate-500">
        Star layout: everyone connects to the host. Max {maxParticipants} people keeps performance stable.
      </p>
    </div>
  );
};

export default MeetingParticipantList;
