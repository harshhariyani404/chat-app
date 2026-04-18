import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { iceServers } from "../lib/webrtcConfig";

const pcConfig = { iceServers };

/**
 * Star topology: each guest has one RTCPeerConnection to the host.
 * The host has one RTCPeerConnection per guest.
 */
export function useStarMeeting({ meetingId, userId, hostId, enabled }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [error, setError] = useState("");

  const localStreamRef = useRef(null);
  const hostIdRef = useRef(hostId);
  const userIdRef = useRef(userId);
  const meetingIdRef = useRef(meetingId);

  const guestPcRef = useRef(null);
  const hostPeersRef = useRef({});
  const pendingIceGuestRef = useRef([]);
  const pendingIceHostRef = useRef({});
  const pendingOffersRef = useRef([]);

  useEffect(() => {
    hostIdRef.current = hostId;
    userIdRef.current = userId;
    meetingIdRef.current = meetingId;
  }, [hostId, userId, meetingId]);

  const isHost = Boolean(hostId && userId && hostId === userId);

  const upsertRemote = useCallback((peerUserId, stream) => {
    if (!stream) return;
    setRemoteStreams((prev) => ({ ...prev, [peerUserId]: stream }));
  }, []);

  const removeRemote = useCallback((peerUserId) => {
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[peerUserId];
      return next;
    });
  }, []);

  const flushPendingIce = async (pc, bucket) => {
    const key = bucket === "guest" ? "guest" : bucket;
    const q =
      key === "guest"
        ? [...pendingIceGuestRef.current]
        : [...(pendingIceHostRef.current[key] || [])];
    if (key === "guest") {
      pendingIceGuestRef.current = [];
    } else {
      pendingIceHostRef.current[key] = [];
    }
    for (const c of q) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch {
        /* ignore */
      }
    }
  };

  const createHostPeerForGuest = useCallback(
    (guestUserId, stream) => {
      if (hostPeersRef.current[guestUserId]) {
        return hostPeersRef.current[guestUserId];
      }

      const pc = new RTCPeerConnection(pcConfig);

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (ev) => {
        const [s] = ev.streams;
        if (s) {
          upsertRemote(guestUserId, s);
        }
      };

      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          socket.emit("meeting-ice-candidate", {
            meetingId: meetingIdRef.current,
            to: guestUserId,
            candidate: ev.candidate.toJSON(),
          });
        }
      };

      hostPeersRef.current[guestUserId] = pc;
      return pc;
    },
    [upsertRemote]
  );

  const processHostOffer = useCallback(
    async (from, sdp) => {
      const stream = localStreamRef.current;
      if (!stream) {
        pendingOffersRef.current.push({ from, sdp });
        return;
      }

      try {
        const pc = createHostPeerForGuest(from, stream);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushPendingIce(pc, from);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("meeting-answer", {
          meetingId: meetingIdRef.current,
          to: from,
          sdp: {
            type: pc.localDescription.type,
            sdp: pc.localDescription.sdp,
          },
        });
      } catch {
        setError("Failed to connect a participant");
      }
    },
    [createHostPeerForGuest]
  );

  const cleanupGuest = useCallback(() => {
    const pc = guestPcRef.current;
    guestPcRef.current = null;
    if (pc) {
      pc.getSenders().forEach((s) => s.track?.stop());
      pc.close();
    }
    pendingIceGuestRef.current = [];
  }, []);

  const cleanupHostPeers = useCallback(() => {
    Object.keys(hostPeersRef.current).forEach((k) => {
      const pc = hostPeersRef.current[k];
      if (pc) {
        pc.getSenders().forEach((s) => s.track?.stop());
        pc.close();
      }
      removeRemote(k);
    });
    hostPeersRef.current = {};
    pendingIceHostRef.current = {};
  }, [removeRemote]);

  useEffect(() => {
    if (!enabled || !meetingId || !hostId || !userId) {
      return undefined;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;

        if (isHost) {
          const pending = pendingOffersRef.current.splice(0);
          for (const { from, sdp } of pending) {
            await processHostOffer(from, sdp);
          }
        }

        setLocalStream(stream);

        if (!isHost) {
          const pc = new RTCPeerConnection(pcConfig);
          guestPcRef.current = pc;

          stream.getTracks().forEach((track) => pc.addTrack(track, stream));

          pc.ontrack = (ev) => {
            const [s] = ev.streams;
            if (s && hostIdRef.current) {
              upsertRemote(hostIdRef.current, s);
            }
          };

          pc.onicecandidate = (ev) => {
            if (ev.candidate && hostIdRef.current) {
              socket.emit("meeting-ice-candidate", {
                meetingId: meetingIdRef.current,
                to: hostIdRef.current,
                candidate: ev.candidate.toJSON(),
              });
            }
          };

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit("meeting-offer", {
            meetingId: meetingIdRef.current,
            to: hostIdRef.current,
            sdp: {
              type: pc.localDescription.type,
              sdp: pc.localDescription.sdp,
            },
          });
        }
      } catch (e) {
        setError(e?.message || "Could not access camera or microphone");
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [enabled, meetingId, hostId, userId, isHost, upsertRemote, processHostOffer]);

  useEffect(() => {
    if (!enabled || !meetingId) {
      return undefined;
    }

    const onOffer = async ({ from, sdp, meetingId: mid }) => {
      if (mid !== meetingIdRef.current || from === userIdRef.current) {
        return;
      }

      if (userIdRef.current !== hostIdRef.current) {
        return;
      }

      await processHostOffer(from, sdp);
    };

    const onAnswer = async ({ from, sdp, meetingId: mid }) => {
      if (mid !== meetingIdRef.current || from !== hostIdRef.current) {
        return;
      }

      const pc = guestPcRef.current;
      if (!pc) {
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushPendingIce(pc, "guest");
      } catch {
        setError("Failed to finalize connection");
      }
    };

    const onIce = async ({ from, candidate, meetingId: mid }) => {
      if (mid !== meetingIdRef.current || !candidate) {
        return;
      }

      const hosting = userIdRef.current === hostIdRef.current;

      if (hosting && from && from !== userIdRef.current) {
        const pc = hostPeersRef.current[from];
        if (pc?.remoteDescription?.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch {
            /* */
          }
        } else {
          pendingIceHostRef.current[from] = pendingIceHostRef.current[from] || [];
          pendingIceHostRef.current[from].push(candidate);
        }
        return;
      }

      if (!hosting && from === hostIdRef.current) {
        const pc = guestPcRef.current;
        if (pc?.remoteDescription?.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch {
            /* */
          }
        } else {
          pendingIceGuestRef.current.push(candidate);
        }
      }
    };

    socket.on("meeting-offer", onOffer);
    socket.on("meeting-answer", onAnswer);
    socket.on("meeting-ice-candidate", onIce);

    return () => {
      socket.off("meeting-offer", onOffer);
      socket.off("meeting-answer", onAnswer);
      socket.off("meeting-ice-candidate", onIce);
    };
  }, [enabled, meetingId, processHostOffer]);

  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;

      const g = guestPcRef.current;
      guestPcRef.current = null;
      if (g) {
        g.getSenders().forEach((s) => s.track?.stop());
        g.close();
      }

      Object.keys(hostPeersRef.current).forEach((k) => {
        const pc = hostPeersRef.current[k];
        if (pc) {
          pc.getSenders().forEach((s) => s.track?.stop());
          pc.close();
        }
      });
      hostPeersRef.current = {};
      pendingIceGuestRef.current = [];
      pendingIceHostRef.current = {};
    };
  }, []);

  const toggleAudio = useCallback(() => {
    const audio = localStreamRef.current?.getAudioTracks()[0];
    if (audio) {
      audio.enabled = !audio.enabled;
    }
  }, []);

  const toggleVideo = useCallback(() => {
    const video = localStreamRef.current?.getVideoTracks()[0];
    if (video) {
      video.enabled = !video.enabled;
    }
  }, []);

  return {
    localStream,
    remoteStreams,
    error,
    isHost,
    toggleAudio,
    toggleVideo,
    cleanupGuest,
    cleanupHostPeers,
  };
}
