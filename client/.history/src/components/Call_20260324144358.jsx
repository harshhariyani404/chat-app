import React, { useEffect, useRef } from "react";
import socket from "../socket";

const Call = ({ user, receiverId }) => {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef();

  const startCall = async (type = "video") => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });

    localVideoRef.current.srcObject = stream;

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerRef.current = peer;

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });

    peer.ontrack = (e) => {
      remoteVideoRef.current.srcObject = e.streams[0];
    };

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          to: receiverId,
          candidate: e.candidate,
        });
      }
    };

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    socket.emit("call-user", {
      to: receiverId,
      from: user._id,
      offer,
      callType: type,
    });
  };

  useEffect(() => {
    socket.on("incoming-call", async ({ from, offer, callType }) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });

      localVideoRef.current.srcObject = stream;

      const peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      peerRef.current = peer;

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      peer.ontrack = (e) => {
        remoteVideoRef.current.srcObject = e.streams[0];
      };

      peer.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", {
            to: from,
            candidate: e.candidate,
          });
        }
      };

      await peer.setRemoteDescription(offer);

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("answer-call", {
        to: from,
        answer,
      });
    });

    socket.on("call-answered", async ({ answer }) => {
      await peerRef.current.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (peerRef.current) {
        await peerRef.current.addIceCandidate(candidate);
      }
    });
  }, []);

  return (
    <div>
      <h3>Call</h3>

      <video ref={localVideoRef} autoPlay muted style={{ width: "200px" }} />
      <video ref={remoteVideoRef} autoPlay style={{ width: "200px" }} />

      <button onClick={() => startCall("audio")}>Audio Call</button>
      <button onClick={() => startCall("video")}>Video Call</button>
    </div>
  );
};

export default Call;