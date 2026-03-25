import React, { useEffect, useRef } from "react";
import { socket } from "../socket";

const Call = ({ user, receiverId }) => {
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const peerRef = useRef();
    const pendingIceCandidatesRef = useRef([]);

    const rtcConfig = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            {
                urls: "turn:openrelay.metered.ca:80",
                username: "openrelayproject",
                credential: "openrelayproject",
            },
        ],
    };

    const startCall = async (type = "video") => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Camera/Microphone not accessible. WebRTC requires HTTPS or localhost.");
            return;
        }

        pendingIceCandidatesRef.current = [];

        const stream = await navigator.mediaDevices.getUserMedia({
            video: type === "video",
            audio: true,
        });

        localVideoRef.current.srcObject = stream;

        const peer = new RTCPeerConnection(rtcConfig);

        peerRef.current = peer;

        peer.oniceconnectionstatechange = () => {
            console.log("ICE State:", peer.iceConnectionState);
        };

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
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Camera/Microphone not accessible. WebRTC requires HTTPS or localhost.");
                return;
            }

            pendingIceCandidatesRef.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({
                video: callType === "video",
                audio: true,
            });

            localVideoRef.current.srcObject = stream;

            const peer = new RTCPeerConnection(rtcConfig);

            peerRef.current = peer;

            // ✅ ADD HERE ALSO
            peer.oniceconnectionstatechange = () => {
                console.log("ICE State (receiver):", peer.iceConnectionState);
            };

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

            while (pendingIceCandidatesRef.current.length > 0) {
                const candidate = pendingIceCandidatesRef.current.shift();
                try {
                    await peer.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error("Error adding queued ICE candidate:", err);
                }
            }

            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            socket.emit("answer-call", {
                to: from,
                answer,
            });
        });

        socket.on("call-answered", async ({ answer }) => {
            if (!peerRef.current) return;
            try {
                await peerRef.current.setRemoteDescription(answer);
                while (pendingIceCandidatesRef.current.length > 0) {
                    const candidate = pendingIceCandidatesRef.current.shift();
                    try {
                        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (err) {
                        console.error("Error adding queued ICE candidate:", err);
                    }
                }
            } catch (err) {
                console.error("Error setting remote description:", err);
            }
        });

        socket.on("ice-candidate", async ({ candidate }) => {
            if (candidate) {
                const peer = peerRef.current;
                if (peer && peer.remoteDescription && peer.remoteDescription.type) {
                    try {
                        await peer.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (e) {
                        console.error("Error adding ICE candidate:", e);
                    }
                } else {
                    pendingIceCandidatesRef.current.push(candidate);
                }
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