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
      isGuest: false,
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
      isGuest: false,
    });
  });

  (meeting?.guestParticipants || []).forEach((g) => {
    const id = String(g.guestId || "");
    if (!id || seen.has(id)) return;
    seen.add(id);
    rows.push({
      id,
      username: g.displayName || "Guest",
      avatar: null,
      isHost: false,
      isGuest: true,
    });
  });

  return (
    <div className="flex h-full flex-col bg-[#202124]">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-4">
        <div>
          <p className="text-xs font-medium text-[#9aa0a6]">People</p>
          <p className="mt-0.5 text-lg font-normal text-[#e8eaed]">
            {rows.length}
            <span className="text-sm font-normal text-[#9aa0a6]"> / {maxParticipants}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2.5 text-[#9aa0a6] transition hover:bg-white/[0.08] hover:text-white lg:hidden"
          aria-label="Close list"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <ul className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {rows.map((row) => {
          const url = getAvatarUrl(row.avatar);
          const isYou = row.id === String(currentUserId);

          return (
            <li
              key={row.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/[0.06]"
            >
              <img
                src={
                  url ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.username)}`
                }
                alt=""
                className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/[0.06]"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[#e8eaed]">
                  {row.username}
                  {isYou ? <span className="ml-1 text-xs text-[#9aa0a6]">(you)</span> : null}
                </p>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {row.isHost ? (
                    <span className="rounded-md bg-[#8ab4f8]/20 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#8ab4f8]">
                      Host
                    </span>
                  ) : null}
                  {row.isGuest ? (
                    <span className="rounded-md bg-[#fdd663]/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#fdd663]">
                      Guest
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="border-t border-white/[0.08] px-4 py-3 text-xs leading-relaxed text-[#9aa0a6]">
        Everyone connects through the host for stable video. Up to {maxParticipants} people in this room.
      </p>
    </div>
  );
};

export default MeetingParticipantList;
