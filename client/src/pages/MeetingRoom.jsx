import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import MeetingControls from "../components/MeetingControls";
import MeetingParticipantList from "../components/MeetingParticipantList";
import VideoGrid from "../components/VideoGrid";
import { MEETING_VIDEO_PAGE_SIZE } from "../config/meetingLimits";
import { api } from "../lib/api";
import { useStarMeeting } from "../hooks/useStarMeeting";
import { socket } from "../socket";

const MeetingRoom = ({ user }) => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [ended, setEnded] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [participantPanelOpen, setParticipantPanelOpen] = useState(false);

  const hostId = meeting?.hostId?._id || meeting?.hostId;
  const enabled = Boolean(meeting && hostId && !ended);
  const maxParticipants = meeting?.maxParticipants ?? 12;

  const { localStream, remoteStreams, error, toggleAudio, toggleVideo } = useStarMeeting({
    meetingId,
    userId: user._id,
    hostId,
    enabled,
  });

  const refreshMeeting = useCallback(async () => {
    try {
      const res = await api.get(`/meetings/${meetingId}`);
      setMeeting(res.data);
    } catch {
      /* */
    }
  }, [meetingId]);

  useEffect(() => {
    socket.connect();
    socket.emit("register", user._id);

    const onConnect = () => {
      socket.emit("register", user._id);
    };

    socket.on("connect", onConnect);
    return () => {
      socket.off("connect", onConnect);
    };
  }, [user._id]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/meetings/${meetingId}`);
        setMeeting(res.data);
      } catch {
        setLoadError("Meeting not found or you cannot open it.");
      }
    };

    void load();
  }, [meetingId]);

  useEffect(() => {
    if (!meetingId || !user._id || !meeting?._id) {
      return undefined;
    }

    socket.emit("join-meeting", { meetingId, userId: user._id });

    const onUsers = (payload) => {
      if (payload.meetingId !== meetingId) {
        return;
      }

      void refreshMeeting();
    };

    const onEnded = ({ meetingId: mid }) => {
      if (mid === meetingId) {
        setEnded(true);
        toast("Meeting ended");
        navigate("/", { replace: true });
      }
    };

    const onMeetingError = (payload) => {
      const msg = payload?.message || "Meeting error";
      toast.error(msg);
      if (payload?.code === "MEETING_FULL") {
        navigate("/", { replace: true });
      }
    };

    socket.on("meeting-users-update", onUsers);
    socket.on("meeting-ended", onEnded);
    socket.on("meeting-error", onMeetingError);

    return () => {
      socket.emit("leave-meeting", { meetingId, userId: user._id });
      socket.off("meeting-users-update", onUsers);
      socket.off("meeting-ended", onEnded);
      socket.off("meeting-error", onMeetingError);
    };
  }, [meetingId, user._id, meeting?._id, navigate, refreshMeeting]);

  const userNames = useMemo(() => {
    const map = { local: user.username };
    if (!meeting) {
      return map;
    }

    const participants = meeting.participants || [];

    participants.forEach((p) => {
      const id = p._id || p;
      const name = p.username || "User";
      map[id] = name;
    });

    const h = meeting.hostId;
    if (h) {
      const hid = h._id || h;
      map[hid] = h.username || "Host";
    }

    return map;
  }, [meeting, user.username]);

  const participantCount = meeting?.participantCount ?? meeting?.participants?.length ?? 0;

  const handleToggleMic = useCallback(() => {
    toggleAudio();
    setMicMuted((m) => !m);
  }, [toggleAudio]);

  const handleToggleCam = useCallback(() => {
    toggleVideo();
    setCamOff((c) => !c);
  }, [toggleVideo]);

  const handleLeave = useCallback(() => {
    socket.emit("leave-meeting", { meetingId, userId: user._id });
    navigate("/", { replace: true });
  }, [meetingId, user._id, navigate]);

  if (loadError) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-950 px-4 text-center">
        <div className="max-w-sm rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
          <p className="text-lg font-semibold text-white">{loadError}</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-500 hover:to-violet-500"
          >
            Back to Connect
          </button>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-950 text-slate-300">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-400" />
        <p className="mt-4 text-sm font-medium">Joining room…</p>
      </div>
    );
  }

  const combinedError = error || (ended ? "Meeting ended." : "");

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-950 text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.35), transparent), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(16, 185, 129, 0.12), transparent)",
        }}
      />

      <header className="relative z-20 flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-3 sm:gap-3 sm:px-5 sm:py-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300">Video room</p>
          <p className="mt-0.5 truncate font-mono text-xs text-slate-200 sm:text-sm">{meetingId}</p>
          <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
            <span className="font-semibold text-slate-200">
              {participantCount}/{maxParticipants}
            </span>{" "}
            connected · max {maxParticipants} (star layout)
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setParticipantPanelOpen((v) => !v)}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-2xl border px-3 text-sm font-semibold transition sm:px-4 ${
              participantPanelOpen
                ? "border-indigo-400/50 bg-indigo-500/20 text-white"
                : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
            }`}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="hidden sm:inline">People</span>
            <span className="rounded-lg bg-white/10 px-1.5 py-0.5 text-xs">{participantCount}</span>
          </button>

          <button
            type="button"
            onClick={handleLeave}
            className="min-h-[44px] rounded-2xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Leave
          </button>
        </div>
      </header>

      {combinedError && (
        <div className="relative z-10 border-b border-rose-500/30 bg-rose-950/50 px-4 py-2 text-center text-sm text-rose-100">
          {combinedError}
        </div>
      )}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col px-2 pb-2 pt-2 sm:px-4">
          <p className="mb-2 text-center text-[11px] text-slate-500 sm:text-xs">
            Up to {MEETING_VIDEO_PAGE_SIZE} video tiles per page — flip pages if more people are on camera.
          </p>
          <VideoGrid localStream={localStream} remoteStreams={remoteStreams} userNames={userNames} />
        </div>

        {participantPanelOpen && (
          <div className="fixed inset-0 z-30 flex justify-end lg:static lg:inset-auto lg:z-0 lg:w-80 lg:max-w-[min(100%,20rem)] lg:shrink-0">
            <button
              type="button"
              className="absolute inset-0 bg-black/55 lg:hidden"
              onClick={() => setParticipantPanelOpen(false)}
              aria-label="Close people list"
            />
            <aside className="relative z-10 flex h-full w-[min(20rem,92vw)] max-w-full flex-col border-l border-white/10 bg-slate-900/98 shadow-2xl backdrop-blur-xl lg:h-auto lg:min-h-[min(100dvh,100%)] lg:w-full lg:bg-slate-900/75 lg:shadow-none">
              <MeetingParticipantList
                meeting={meeting}
                currentUserId={user._id}
                maxParticipants={maxParticipants}
                onClose={() => setParticipantPanelOpen(false)}
              />
            </aside>
          </div>
        )}
      </div>

      <MeetingControls
        onToggleMic={handleToggleMic}
        onToggleCam={handleToggleCam}
        onLeave={handleLeave}
        micMuted={micMuted}
        camOff={camOff}
      />
    </div>
  );
};

export default MeetingRoom;
