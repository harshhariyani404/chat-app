import { useMemo, useEffect, useRef, useState } from "react";
import { MEETING_VIDEO_PAGE_SIZE } from "../config/meetingLimits";

/** Tile fills its grid cell; video is cover-cropped for a clean grid. */
const VideoTile = ({ stream, label, isLocal, cameraOff }) => {
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

  const showCameraOff = Boolean(isLocal && cameraOff);
  const initial = (label || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="relative h-full min-h-0 w-full min-w-0 overflow-hidden rounded-md bg-[#3c4043] shadow-sm ring-1 ring-white/[0.06] sm:rounded-lg">
      {stream && !showCameraOff ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={isLocal}
          className="h-full w-full object-cover object-center"
        />
      ) : (
        <div className="flex h-full min-h-[4rem] w-full flex-col items-center justify-center gap-0.5 bg-gradient-to-br from-[#3c4043] to-[#202124] px-0.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5f6368] text-xs font-semibold text-white/95 sm:h-9 sm:w-9 sm:text-sm">
            {initial}
          </div>
          <p className="line-clamp-2 px-0.5 text-center text-[9px] font-medium leading-tight text-white/65 sm:text-[10px]">
            {showCameraOff ? "Camera off" : "Connecting…"}
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-start p-0.5 sm:p-1">
        <div className="max-w-full truncate rounded bg-black/50 px-1 py-px text-[9px] font-medium text-white/95 sm:text-[10px]">
          <span className="truncate">{label}</span>
          {isLocal ? <span className="ml-0.5 text-white/50">(You)</span> : null}
        </div>
      </div>
    </div>
  );
};

const TileWrap = ({ children }) => (
  <div className="relative flex h-full min-h-0 min-w-0 w-full items-stretch justify-stretch">{children}</div>
);

/**
 * Per-page layouts (up to 6 tiles): 1×1, 1×2, 1×3, 2×2, 3+2 centered, 3×2.
 * When `participantSlots` is set (meeting roster), every person gets a tile so
 * layout matches "N in call" even before all WebRTC streams connect.
 */
const VideoGrid = ({
  localStream,
  remoteStreams,
  userNames = {},
  localCameraOff = false,
  participantSlots = null,
}) => {
  const pageSize = MEETING_VIDEO_PAGE_SIZE;
  const [page, setPage] = useState(0);

  const tiles = useMemo(() => {
    if (participantSlots?.length) {
      return participantSlots.map((s) => {
        const id = String(s.id);
        const rs = remoteStreams || {};
        const stream = s.isLocal ? localStream : rs[id] ?? rs[s.id] ?? null;
        const label =
          s.label || (s.isLocal ? userNames.local || "You" : userNames[id] || userNames[s.id] || "Guest");
        return {
          key: id,
          stream,
          label,
          isLocal: Boolean(s.isLocal),
        };
      });
    }

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
  }, [participantSlots, localStream, remoteStreams, userNames]);

  const pageCount = Math.max(1, Math.ceil(tiles.length / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, pageCount - 1)));
  }, [pageCount, tiles.length]);

  const safePage = Math.min(page, pageCount - 1);
  const pageTiles = tiles.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const showPagination = tiles.length > pageSize;
  const m = pageTiles.length;

  const renderTile = (t) => (
    <VideoTile
      stream={t.stream}
      label={t.label}
      isLocal={t.isLocal}
      cameraOff={t.isLocal && localCameraOff}
    />
  );

  const tight = "h-full min-h-0 w-full flex-1 gap-0.5 p-0.5 sm:gap-1 sm:p-1";
  const row1 = "[grid-template-rows:minmax(0,1fr)]";
  const row2eq = "[grid-template-rows:repeat(2,minmax(0,1fr))]";

  let layout = null;

  if (m === 0) {
    layout = null;
  } else if (m === 1) {
    layout = (
      <div className="grid h-full min-h-0 flex-1 place-items-stretch place-content-center p-0.5 sm:p-1">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[min(100%,20rem)] items-stretch">
          <TileWrap>{renderTile(pageTiles[0])}</TileWrap>
        </div>
      </div>
    );
  } else if (m === 2) {
    layout = (
      <div className={`grid ${tight} grid-cols-2 grid-rows-1 ${row1}`}>
        <TileWrap>{renderTile(pageTiles[0])}</TileWrap>
        <TileWrap>{renderTile(pageTiles[1])}</TileWrap>
      </div>
    );
  } else if (m === 3) {
    layout = (
      <div className={`grid ${tight} grid-cols-3 grid-rows-1 ${row1}`}>
        <TileWrap>{renderTile(pageTiles[0])}</TileWrap>
        <TileWrap>{renderTile(pageTiles[1])}</TileWrap>
        <TileWrap>{renderTile(pageTiles[2])}</TileWrap>
      </div>
    );
  } else if (m === 4) {
    layout = (
      <div className={`grid ${tight} grid-cols-2 grid-rows-2 ${row2eq}`}>
        {pageTiles.map((t) => (
          <TileWrap key={t.key}>{renderTile(t)}</TileWrap>
        ))}
      </div>
    );
  } else if (m === 5) {
    layout = (
      <div className={`grid ${tight} grid-cols-6 grid-rows-2 ${row2eq}`}>
        {pageTiles.map((t, i) => {
          let cell = "flex min-h-0 min-w-0 items-stretch justify-stretch";
          if (i < 3) cell += " col-span-2";
          if (i === 3) cell += " col-span-2 col-start-2";
          if (i === 4) cell += " col-span-2 col-start-4";
          return (
            <div key={t.key} className={cell}>
              {renderTile(t)}
            </div>
          );
        })}
      </div>
    );
  } else {
    layout = (
      <div className={`grid ${tight} grid-cols-3 grid-rows-2 ${row2eq}`}>
        {pageTiles.map((t) => (
          <TileWrap key={t.key}>{renderTile(t)}</TileWrap>
        ))}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="mx-auto flex min-h-0 w-full max-h-[min(72dvh,calc(100dvh-10rem))] max-w-[min(100%,56rem)] flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col">{layout}</div>
      </div>

      {showPagination ? (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-1.5 border-t border-[#3c4043] bg-[#202124]/95 px-2 py-1.5 sm:gap-3 sm:py-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage <= 0}
            className="min-h-[34px] rounded-full border border-[#5f6368] bg-[#3c4043] px-3 text-[11px] font-medium text-[#e8eaed] transition enabled:hover:bg-[#4a4d51] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[38px] sm:px-4 sm:text-xs"
          >
            Previous
          </button>
          <span className="min-w-[6.5rem] text-center text-[10px] tabular-nums text-[#9aa0a6] sm:text-xs">
            Page {safePage + 1} of {pageCount}
            <span className="mt-0.5 block text-[9px] text-[#5f6368]">({tiles.length} in call)</span>
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={safePage >= pageCount - 1}
            className="min-h-[34px] rounded-full border border-[#5f6368] bg-[#3c4043] px-3 text-[11px] font-medium text-[#e8eaed] transition enabled:hover:bg-[#4a4d51] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[38px] sm:px-4 sm:text-xs"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default VideoGrid;
