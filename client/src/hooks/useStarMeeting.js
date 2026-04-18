import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { iceServers } from "../lib/webrtcConfig";

const pcConfig = { iceServers };

/**
 * Full mesh WebRTC: each participant has one RTCPeerConnection per other participant.
 * Signaling (offer / answer / ICE) is relayed through the socket server.
 *
 * Pairing uses a fixed ordering (string compare on ids): the lexicographically
 * smaller id sends the offer so offers never collide.
 */
export function useStarMeeting({ meetingId, userId, peerIds = [], hostId, enabled }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [error, setError] = useState("");

  const localStreamRef = useRef(null);
  const meetingIdRef = useRef(meetingId);
  const userIdRef = useRef(userId);
  const peerIdsRef = useRef(peerIds);
  const peersRef = useRef({});
  const pendingIceRef = useRef({});
  const pendingOffersRef = useRef([]);

  useEffect(() => {
    meetingIdRef.current = meetingId;
    userIdRef.current = userId;
    peerIdsRef.current = peerIds;
  }, [meetingId, userId, peerIds]);

  const isHost = Boolean(hostId && userId && String(hostId) === String(userId));

  const upsertRemote = useCallback((peerUserId, stream) => {
    if (!stream) return;
    const key = String(peerUserId);
    setRemoteStreams((prev) => ({ ...prev, [key]: stream }));
  }, []);

  const removeRemote = useCallback((peerUserId) => {
    const key = String(peerUserId);
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const flushPendingIceForPeer = useCallback(async (peerKey) => {
    const pc = peersRef.current[peerKey];
    if (!pc) return;
    const q = [...(pendingIceRef.current[peerKey] || [])];
    pendingIceRef.current[peerKey] = [];
    for (const c of q) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const attachPeerHandlers = useCallback(
    (pc, remotePeerKey) => {
      pc.ontrack = (ev) => {
        const [s] = ev.streams;
        if (s) upsertRemote(remotePeerKey, s);
      };
      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          socket.emit("meeting-ice-candidate", {
            meetingId: meetingIdRef.current,
            to: remotePeerKey,
            candidate: ev.candidate.toJSON(),
          });
        }
      };
    },
    [upsertRemote]
  );

  const closePeer = useCallback(
    (peerKey) => {
      const pc = peersRef.current[peerKey];
      if (pc) {
        pc.close();
      }
      delete peersRef.current[peerKey];
      delete pendingIceRef.current[peerKey];
      removeRemote(peerKey);
    },
    [removeRemote]
  );

  const processAnswererOffer = useCallback(
    async (from, sdp) => {
      const stream = localStreamRef.current;
      const fromKey = String(from);
      const myId = String(userIdRef.current);

      if (!stream) {
        pendingOffersRef.current.push({ from: fromKey, sdp });
        return;
      }

      if (myId < fromKey) {
        return;
      }

      try {
        let pc = peersRef.current[fromKey];
        if (!pc) {
          pc = new RTCPeerConnection(pcConfig);
          peersRef.current[fromKey] = pc;
          attachPeerHandlers(pc, fromKey);
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        }

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushPendingIceForPeer(fromKey);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("meeting-answer", {
          meetingId: meetingIdRef.current,
          to: fromKey,
          sdp: {
            type: pc.localDescription.type,
            sdp: pc.localDescription.sdp,
          },
        });
      } catch {
        setError("Failed to connect a participant");
      }
    },
    [attachPeerHandlers, flushPendingIceForPeer]
  );

  const createAndOfferTo = useCallback(
    async (peerKey, stream) => {
      if (peersRef.current[peerKey]) return;

      try {
        const pc = new RTCPeerConnection(pcConfig);
        peersRef.current[peerKey] = pc;
        attachPeerHandlers(pc, peerKey);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("meeting-offer", {
          meetingId: meetingIdRef.current,
          to: peerKey,
          sdp: {
            type: pc.localDescription.type,
            sdp: pc.localDescription.sdp,
          },
        });
      } catch {
        closePeer(peerKey);
        setError("Failed to connect a participant");
      }
    },
    [attachPeerHandlers, closePeer]
  );

  const syncMeshPeers = useCallback(
    async (stream) => {
      if (!stream) return;

      const current = new Set((peerIdsRef.current || []).map(String));
      const myId = String(userIdRef.current);

      for (const id of Object.keys(peersRef.current)) {
        if (!current.has(id)) {
          closePeer(id);
        }
      }

      for (const peerId of current) {
        if (myId < peerId && !peersRef.current[peerId]) {
          await createAndOfferTo(peerId, stream);
        }
      }
    },
    [closePeer, createAndOfferTo]
  );

  useEffect(() => {
    if (!enabled || !meetingId || !userId) {
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
        setLocalStream(stream);

        const pending = pendingOffersRef.current.splice(0);
        for (const { from, sdp } of pending) {
          await processAnswererOffer(from, sdp);
        }

        await syncMeshPeers(stream);
      } catch (e) {
        setError(e?.message || "Could not access camera or microphone");
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [enabled, meetingId, userId, processAnswererOffer, syncMeshPeers]);

  useEffect(() => {
    if (!enabled || !localStreamRef.current) {
      return undefined;
    }
    void syncMeshPeers(localStreamRef.current);
  }, [peerIds, enabled, syncMeshPeers]);

  useEffect(() => {
    if (!enabled || !meetingId) {
      return undefined;
    }

    const onOffer = async ({ from, sdp, meetingId: mid }) => {
      if (mid !== meetingIdRef.current) {
        return;
      }
      const fromKey = String(from);
      if (fromKey === String(userIdRef.current)) {
        return;
      }
      await processAnswererOffer(fromKey, sdp);
    };

    const onAnswer = async ({ from, sdp, meetingId: mid }) => {
      if (mid !== meetingIdRef.current) {
        return;
      }
      const fromKey = String(from);
      const pc = peersRef.current[fromKey];
      if (!pc) {
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushPendingIceForPeer(fromKey);
      } catch {
        setError("Failed to finalize connection");
      }
    };

    const onIce = async ({ from, candidate, meetingId: mid }) => {
      if (mid !== meetingIdRef.current || !candidate) {
        return;
      }
      const fromKey = String(from);
      const pc = peersRef.current[fromKey];
      if (pc?.remoteDescription?.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {
          /* */
        }
      } else {
        pendingIceRef.current[fromKey] = pendingIceRef.current[fromKey] || [];
        pendingIceRef.current[fromKey].push(candidate);
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
  }, [enabled, meetingId, processAnswererOffer, flushPendingIceForPeer]);

  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;

      Object.keys(peersRef.current).forEach((k) => {
        peersRef.current[k]?.close();
      });
      peersRef.current = {};
      pendingIceRef.current = {};
      pendingOffersRef.current = [];
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
  };
}
