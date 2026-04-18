import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MEETING_VIDEO_PAGE_SIZE } from "../config/meetingLimits";

const VideoTile = ({ stream, label, isLocal }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !stream) {
      return undefined;
    }

    el.srcObject = stream;
    return () => {
      el.srcObject = null;
    };
  }, [stream]);

  return (
    <div className="group relative aspect-video w-full min-h-0 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-lg ring-1 ring-white/5 sm:rounded-2xl">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={isLocal}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 py-1.5 sm:px-3 sm:py-2">
        <p className="truncate text-[11px] font-semibold text-white/95 sm:text-xs">
          {label}
          {isLocal ? <span className="ml-1 font-normal text-white/60">(You)</span> : null}
        </p>
      </div>
    </div>
  );
};

const VideoGrid = ({ localStream, remoteStreams, userNames = {}, pageSize = MEETING_VIDEO_PAGE_SIZE }) => {
  const [requestedPage, setRequestedPage] = useState(0);

  const tiles = useMemo(() => {
    const list = [];

    if (localStream) {
      list.push({
        key: "local",
        stream: localStream,
        label: userNames.local || "You",
        isLocal: true,
      });
    }

    Object.entries(remoteStreams || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([uid, stream]) => {
        list.push({
          key: uid,
          stream,
          label: userNames[uid] || "Guest",
          isLocal: false,
        });
      });

    return list;
  }, [localStream, remoteStreams, userNames]);

  const maxPage = Math.max(0, Math.ceil(tiles.length / pageSize) - 1);
  const page = Math.min(requestedPage, maxPage);
  const setPage = useCallback(
    (updater) => {
      setRequestedPage((prev) => {
        const current = Math.min(prev, maxPage);
        const next = typeof updater === "function" ? updater(current) : updater;
        return next;
      });
    },
    [maxPage],
  );

  const totalPages = Math.max(1, Math.ceil(tiles.length / pageSize) || 1);
  const start = page * pageSize;
  const pageTiles = tiles.slice(start, start + pageSize);

  const gridClass =
    pageTiles.length <= 1
      ? "grid-cols-1"
      : pageTiles.length === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : pageTiles.length <= 4
          ? "grid-cols-2"
          : "grid-cols-2 sm:grid-cols-3";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={`grid min-h-0 flex-1 gap-2 overflow-auto p-1 sm:gap-3 sm:p-2 ${gridClass} auto-rows-fr`}
        style={{ maxHeight: "min(70dvh, 720px)" }}
      >
        {pageTiles.map((t) => (
          <VideoTile key={`${t.key}-${page}`} stream={t.stream} label={t.label} isLocal={t.isLocal} />
        ))}
      </div>

      {tiles.length > pageSize && (
        <div className="mt-2 flex flex-shrink-0 items-center justify-center gap-3 border-t border-white/10 py-2 sm:mt-3 sm:py-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page <= 0}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
          >
            Previous
          </button>
          <span className="text-xs font-medium text-slate-300 sm:text-sm">
            Page {page + 1} / {totalPages}
            <span className="ml-2 text-slate-500">
              ({tiles.length} feeds)
            </span>
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoGrid;
