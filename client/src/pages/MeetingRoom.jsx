import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import MeetingControls from "../components/MeetingControls";
import MeetingParticipantList from "../components/MeetingParticipantList";
import VideoGrid from "../components/VideoGrid";
import { API_BASE_URL } from "../config/env";
import { api } from "../lib/api";
import { clearMeetingGuest } from "../lib/meetingGuest";
import { useStarMeeting } from "../hooks/useStarMeeting";
import { socket } from "../socket";

const MeetingRoom = ({ user }) => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const isGuest = Boolean(user?.isGuest);
  const [meeting, setMeeting] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [ended, setEnded] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [participantPanelOpen, setParticipantPanelOpen] = useState(false);

  const hostId = meeting?.hostId?._id || meeting?.hostId;
  const enabled = Boolean(meeting && hostId && !ended);
  const maxParticipants = meeting?.maxParticipants ?? 12;

  const peerIds = useMemo(() => {
    if (!meeting) return [];
    const ids = new Set();
    const h = meeting.hostId?._id || meeting.hostId;
    if (h) ids.add(String(h));
    (meeting.participants || []).forEach((p) => ids.add(String(p._id || p)));
    (meeting.guestParticipants || []).forEach((g) => {
      if (g?.guestId) ids.add(String(g.guestId));
    });
    ids.delete(String(user._id));
    return Array.from(ids);
  }, [meeting, user._id]);

  const { localStream, remoteStreams, error, toggleAudio, toggleVideo } = useStarMeeting({
    meetingId,
    userId: user._id,
    peerIds,
    hostId,
    enabled,
  });

  const refreshMeeting = useCallback(async () => {
    try {
      if (isGuest) {
        const res = await axios.get(`${API_BASE_URL}/api/meetings/public/${meetingId}`);
        setMeeting(res.data);
      } else {
        const res = await api.get(`/meetings/${meetingId}`);
        setMeeting(res.data);
      }
    } catch {
      /* */
    }
  }, [meetingId, isGuest]);

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
        if (isGuest) {
          const res = await axios.get(`${API_BASE_URL}/api/meetings/public/${meetingId}`);
          setMeeting(res.data);
        } else {
          const res = await api.get(`/meetings/${meetingId}`);
          setMeeting(res.data);
        }
      } catch {
        if (isGuest) {
          clearMeetingGuest(meetingId);
        }
        setLoadError("Meeting not found or you cannot open it.");
      }
    };

    void load();
  }, [meetingId, isGuest]);

  useEffect(() => {
    if (!meetingId || !user._id || !meeting?._id) {
      return undefined;
    }

    if (isGuest) {
      socket.emit("join-meeting", { meetingId, guestId: user._id, isGuest: true });
    } else {
      socket.emit("join-meeting", { meetingId, userId: user._id });
    }

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
        if (isGuest) {
          clearMeetingGuest(meetingId);
        }
        navigate("/", { replace: true });
      }
    };

    const onMeetingError = (payload) => {
      const msg = payload?.message || "Meeting error";
      toast.error(msg);
      if (payload?.code === "MEETING_FULL") {
        if (isGuest) {
          clearMeetingGuest(meetingId);
        }
        navigate("/", { replace: true });
      }
    };

    socket.on("meeting-users-update", onUsers);
    socket.on("meeting-ended", onEnded);
    socket.on("meeting-error", onMeetingError);

    return () => {
      if (isGuest) {
        socket.emit("leave-meeting", { meetingId, guestId: user._id, isGuest: true });
      } else {
        socket.emit("leave-meeting", { meetingId, userId: user._id });
      }
      socket.off("meeting-users-update", onUsers);
      socket.off("meeting-ended", onEnded);
      socket.off("meeting-error", onMeetingError);
    };
  }, [meetingId, user._id, meeting?._id, navigate, refreshMeeting, isGuest]);

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

    (meeting.guestParticipants || []).forEach((g) => {
      if (g?.guestId) {
        map[g.guestId] = g.displayName || "Guest";
      }
    });

    const h = meeting.hostId;
    if (h) {
      const hid = h._id || h;
      map[hid] = h.username || "Host";
    }

    return map;
  }, [meeting, user.username]);

  /** One tile per person in the meeting (not only active WebRTC streams) so layout matches headcount. */
  const videoParticipantSlots = useMemo(() => {
    if (!meeting) return null;
    const myId = String(user._id);
    const seen = new Set([myId]);
    const others = [];

    const addOther = (rawId, fallbackLabel) => {
      const id = String(rawId ?? "");
      if (!id || seen.has(id)) return;
      seen.add(id);
      const label = userNames[id] || fallbackLabel || "Guest";
      others.push({ id, label, isLocal: false });
    };

    const host = meeting.hostId;
    if (host) {
      addOther(host._id ?? host, host.username || "Host");
    }

    (meeting.participants || []).forEach((p) => {
      addOther(p._id ?? p, p.username || "Member");
    });

    (meeting.guestParticipants || []).forEach((g) => {
      if (g?.guestId) {
        addOther(g.guestId, g.displayName || "Guest");
      }
    });

    others.sort((a, b) => a.id.localeCompare(b.id));

    return [{ id: myId, label: user.username || "You", isLocal: true }, ...others];
  }, [meeting, user._id, user.username, userNames]);

  const participantCount =
    meeting?.participantCount ??
    (meeting?.participants?.length ?? 0) + (meeting?.guestParticipants?.length ?? 0);

  const handleToggleMic = useCallback(() => {
    toggleAudio();
    setMicMuted((m) => !m);
  }, [toggleAudio]);

  const handleToggleCam = useCallback(() => {
    toggleVideo();
    setCamOff((c) => !c);
  }, [toggleVideo]);

  const handleLeave = useCallback(() => {
    if (isGuest) {
      socket.emit("leave-meeting", { meetingId, guestId: user._id, isGuest: true });
      clearMeetingGuest(meetingId);
    } else {
      socket.emit("leave-meeting", { meetingId, userId: user._id });
    }
    navigate("/", { replace: true });
  }, [meetingId, user._id, navigate, isGuest]);

  if (loadError) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#202124] px-4 text-center text-[#e8eaed]">
        <div className="max-w-sm rounded-2xl border border-white/[0.12] bg-[#2d2f31] p-8 shadow-2xl">
          <p className="text-lg font-medium">{loadError}</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 w-full rounded-full bg-[#1a73e8] py-3 text-sm font-semibold text-white transition hover:bg-[#1967d2]"
          >
            Back to Connect
          </button>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#202124] text-[#9aa0a6]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#5f6368] border-t-[#8ab4f8]" />
        <p className="mt-4 text-sm font-medium text-[#e8eaed]">Joining room…</p>
      </div>
    );
  }

  const combinedError = error || (ended ? "Meeting ended." : "");

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#202124] text-[#e8eaed]">
      <header className="relative z-20 flex flex-wrap items-center gap-2 border-b border-[#3c4043] px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3c4043] sm:flex" aria-hidden>
            <svg className="h-5 w-5 text-[#8ab4f8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#e8eaed] sm:text-base">Meeting</p>
            <p className="truncate font-mono text-[11px] text-[#9aa0a6] sm:text-xs">{meetingId}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[#9aa0a6]">
              <span>
                <span className="font-medium text-[#e8eaed]">{participantCount}</span> in call
                <span className="text-[#5f6368]"> · </span>
                max {maxParticipants}
              </span>
              {isGuest ? (
                <span className="rounded-full bg-[#f9ab00]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#fdd663]">
                  Guest
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setParticipantPanelOpen((v) => !v)}
            className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-3 text-sm font-medium transition sm:min-h-[44px] sm:px-4 ${
              participantPanelOpen
                ? "border-[#8ab4f8]/50 bg-[#394457] text-[#e8eaed]"
                : "border-transparent bg-[#3c4043] text-[#e8eaed] hover:bg-[#4a4d51]"
            }`}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span className="hidden sm:inline">People</span>
            <span className="rounded-full bg-[#5f6368] px-2 py-0.5 text-xs tabular-nums">{participantCount}</span>
          </button>
        </div>
      </header>

      {combinedError && (
        <div className="relative z-10 border-b border-[#f28b82]/30 bg-[#3c1f1f] px-4 py-2 text-center text-sm text-[#f9dedc]">
          {combinedError}
        </div>
      )}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col pb-[max(6.5rem,env(safe-area-inset-bottom))] lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col pt-1 sm:pt-2">
          <VideoGrid
            localStream={localStream}
            remoteStreams={remoteStreams}
            userNames={userNames}
            localCameraOff={camOff}
            participantSlots={videoParticipantSlots}
          />
        </div>

        {participantPanelOpen && (
          <div className="fixed inset-0 z-30 flex justify-end lg:static lg:inset-auto lg:z-0 lg:w-80 lg:max-w-[min(100%,20rem)] lg:shrink-0 lg:self-stretch">
            <button
              type="button"
              className="absolute inset-0 bg-black/60 lg:hidden"
              onClick={() => setParticipantPanelOpen(false)}
              aria-label="Close people list"
            />
            <aside className="relative z-10 flex h-full w-[min(20rem,92vw)] max-w-full flex-col border-l border-[#3c4043] bg-[#202124] shadow-2xl lg:h-auto lg:min-h-0 lg:w-full lg:shadow-none">
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
