import { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { socket } from "../socket";
import Message from "./Message";
import EmojiPicker from "emoji-picker-react";

const API_BASE_URL = "http://localhost:5000";
const imageMimePrefix = "image/";
const videoMimePrefix = "video/";
const fileTypeOptions = [
  { id: "images", label: "Images", accept: "image/*" },
  { id: "videos", label: "Videos", accept: "video/*" },
  {
    id: "documents",
    label: "Documents",
    accept: ".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx",
  },
  { id: "all", label: "Any file", accept: "*/*" },
];

const getSelectedFileKind = (file) => {
  const mimeType = file?.type?.toLowerCase() || "";

  if (mimeType === "application/pdf") {
    return "pdf";
  }

  if (mimeType.startsWith(imageMimePrefix)) {
    return "image";
  }

  if (mimeType.startsWith(videoMimePrefix)) {
    return "video";
  }

  return "file";
};

const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDateLabel = (date) => {
  const today = new Date()
  const msgDate = new Date(date)

  const isToday = today.toDateString() === msgDate.toDateString()

  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const isYesterday = yesterday.toDateString() === msgDate.toDateString()

  if (isToday) {
    return 'Today'
  }

  if (isYesterday) {
    return 'Yesterday'
  }

  return msgDate.toLocaleDateString()
}

const Chat = ({
  user,
  selected,
  setSelected,
  setUsers,
  fetchUsers,
  incomingCallData,
  setIncomingCallData,
}) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [newName, setNewName] = useState("");
  const [showInfoMenu, setShowInfoMenu] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFilePreviews, setSelectedFilePreviews] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showFileTypeMenu, setShowFileTypeMenu] = useState(false);
  const [fileInputAccept, setFileInputAccept] = useState("*/*");
  const [fullScreenPreview, setFullScreenPreview] = useState(null);
  const [callState, setCallState] = useState("idle");
  const [callType, setCallType] = useState("video");
  const [incomingCall, setIncomingCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callError, setCallError] = useState("");

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const infoMenuRef = useRef(null);
  const fileMenuRef = useRef(null);
  const emojiMenuRef = useRef(null);
  const chatRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const activeCallPeerIdRef = useRef(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const chatContainer = chatRef.current;
    if (!chatContainer) return;

    const scrollToBottom = () => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    };

    scrollToBottom();

    const observer = new ResizeObserver(scrollToBottom);
    if (chatContainer.firstElementChild) {
      observer.observe(chatContainer.firstElementChild);
    }

    chatContainer.addEventListener("load", scrollToBottom, true);

    return () => {
      observer.disconnect();
      chatContainer.removeEventListener("load", scrollToBottom, true);
    };
  }, [messages]);

  useEffect(() => {
    if (!selected) return;

    setMessages([]);
    setSelectedFiles([]);

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/messages/${selected._id}`,
          { headers: { Authorization: token } }
        );
        setMessages(res.data);
      } catch (err) {
        console.log("Error loading messages:", err);
      }
    };

    fetchMessages();

    const handleReceiveMessage = (data) => {
      const fromId = data.from?._id || data.from;
      const toId = data.to?._id || data.to;

      if (
        (fromId === user._id && toId === selected._id) ||
        (fromId === selected._id && toId === user._id)
      ) {
        setMessages((prev) => {
          if (prev.some((message) => message._id === data._id)) {
            return prev;
          }

          return [...prev, data];
        });
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => socket.off("receive_message", handleReceiveMessage);
  }, [selected, user._id, token]);

  useEffect(() => {
    const handleStatusUpdate = ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, status } : msg
        )
      );
    };

    socket.on("message_status_update", handleStatusUpdate);

    return () => socket.off("message_status_update", handleStatusUpdate);
  }, []);

  useEffect(() => {
    const unseenMessages = messages.filter((msg) => {
      const toId = msg.to?._id || msg.to;
      return toId === user._id && msg.status !== "seen";
    });

    if (unseenMessages.length > 0) {
      unseenMessages.forEach((msg) => {
        socket.emit("message_seen", {
          messageId: msg._id,
        });
      });

      // ✅ Update local state to avoid repeated emits
      setMessages((prev) =>
        prev.map((msg) => {
          const toId = msg.to?._id || msg.to;

          if (toId === user._id && msg.status !== "seen") {
            return { ...msg, status: "seen" };
          }

          return msg;
        })
      );
    }
  }, [messages, user._id]);

  useEffect(() => {
    socket.on("message_edited", (updatedMsg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))
      );
    });

    socket.on("message_deleted_for_everyone", (updatedMsg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))
      );
    });

    socket.on("message_deleted_for_me", ({ messageId, userId }) => {
      if (userId !== user._id) {
        return;
      }

      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    });

    return () => {
      socket.off("message_edited");
      socket.off("message_deleted_for_everyone");
      socket.off("message_deleted_for_me");
    };
  }, [user._id]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [selected]);

  useEffect(() => {
    setShowInfoMenu(false);
    setNewName(selected?.displayName || selected?.username || "");
  }, [selected]);

  useEffect(() => {
    const nextPreviews = selectedFiles.map((file) => {
      const kind = getSelectedFileKind(file);

      return {
        file,
        kind,
        previewUrl:
          kind === "image" || kind === "video" || kind === "pdf" ? URL.createObjectURL(file) : null,
      };
    });

    setSelectedFilePreviews(nextPreviews);

    return () => {
      nextPreviews.forEach(({ previewUrl }) => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      });
    };
  }, [selectedFiles]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (infoMenuRef.current && !infoMenuRef.current.contains(event.target)) {
        setShowInfoMenu(false);
      }

      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target)) {
        setShowFileTypeMenu(false);
      }

      if (emojiMenuRef.current && !emojiMenuRef.current.contains(event.target)) {
        setShowEmoji(false);
      }
    };

    if (showInfoMenu || showFileTypeMenu || showEmoji) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showInfoMenu, showFileTypeMenu, showEmoji]);

  useEffect(() => {
    if (!fullScreenPreview) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") setFullScreenPreview(null);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [fullScreenPreview]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const peerId = activeCallPeerIdRef.current || incomingCall?.from || selected._id;
      if (callState !== "idle" && peerId) {
        socket.emit("call-ended", {
          to: peerId,
          from: user._id,
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [callState, incomingCall, selected._id, user._id]);

  useEffect(() => {
    // Process a newly passed call from Home.jsx once we have focused the correct chat
    if (incomingCallData && selected && incomingCallData.from === selected._id) {
      setIncomingCall({
        from: incomingCallData.from,
        offer: incomingCallData.offer,
        callType: incomingCallData.callType,
      });
      setCallType(incomingCallData.callType);
      setCallState("incoming");
      setCallError("");

      if (setIncomingCallData) {
        setIncomingCallData(null); // Consume the incoming event data
      }
    }
  }, [incomingCallData, selected, setIncomingCallData]);

  useEffect(() => {
    const handleCallAnswered = async ({ answer }) => {
      if (!peerRef.current) return;

      await peerRef.current.setRemoteDescription(answer);
      setCallState("active");
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (peerRef.current && candidate) {
        await peerRef.current.addIceCandidate(candidate);
      }
    };

    const handleCallEnded = () => {
      cleanupCall(false);
    };

    const handleCallDeclined = () => {
      cleanupCall(true, "Call was declined");
    };

    socket.on("call-answered", handleCallAnswered);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("call-ended", handleCallEnded);
    socket.on("call-declined", handleCallDeclined);

    return () => {
      socket.off("call-answered", handleCallAnswered);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("call-ended", handleCallEnded);
      socket.off("call-declined", handleCallDeclined);
    };
  }, [selected._id, incomingCall]);

  useEffect(() => {
    return () => {
      if (activeCallPeerIdRef.current || peerRef.current) {
        const peerId = activeCallPeerIdRef.current || selected._id;
        cleanupCall(false);
        socket.emit("call-ended", {
          to: peerId,
          from: user._id,
        });
      }

    };
  }, [selected._id, user._id]);

  const addUserToSidebar = () => {
    setUsers((prev) => {
      const exists = prev.find((u) => u._id === selected._id);
      if (exists) return prev;
      return [...prev, selected];
    });
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  const sendMessage = () => {
    if (!text.trim()) return;

    socket.emit("send_message", {
      from: user._id,
      to: selected._id,
      message: text.trim(),
      attachments: [],
    });

    addUserToSidebar();
    setText("");
  };

  const handleComposerSubmit = () => {
    if (selectedFiles.length > 0) {
      sendFiles();
      return;
    }

    sendMessage();
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setShowFileTypeMenu(false);
  };

  const openFilePicker = (accept) => {
    setShowFileTypeMenu(false);
    setFileInputAccept(accept);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.accept = accept; // 🔥 FIX
      fileInputRef.current.click();
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const sendFiles = async () => {
    if (!selectedFiles.length || !selected) return;

    try {
      setIsUploadingFiles(true);

      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));

      if (text.trim()) {
        formData.append("message", text.trim());
      }

      await axios.post(
        `${API_BASE_URL}/api/messages/${selected._id}/files`,
        formData,
        {
          headers: {
            Authorization: token,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      addUserToSidebar();
      setText("");
      setSelectedFiles([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.log("Error uploading files:", err);
      toast.error(err.response?.data?.message || "Failed to upload files");
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const updateNickname = async () => {
    if (!newName.trim()) return;

    try {
      await axios.post(`${API_BASE_URL}/api/contacts/nickname`, {
        userId: user._id,
        contactUserId: selected._id,
        nickname: newName,
      });

      setSelected((prev) => ({
        ...prev,
        displayName: newName,
      }));

      setUsers((prev) => {
        const exists = prev.find((u) => u._id === selected._id);

        if (exists) {
          return prev.map((u) =>
            u._id === selected._id ? { ...u, displayName: newName } : u
          );
        }

        return [...prev, { ...selected, displayName: newName }];
      });

      await fetchUsers();
      setShowInfoMenu(false);
      setNewName("");
    } catch (err) {
      console.log("Error updating nickname", err);
      toast.error("Failed to update nickname");
    }
  };

  const formatTime = (time) => {
    if (!time) return "";

    const diff = Date.now() - new Date(time);
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours} hr ago`;

    return new Date(time).toLocaleString();
  };

  const cleanupCall = (preserveError = false, nextError = "") => {
    try {
      peerRef.current?.getSenders().forEach(s => s.track?.stop());
    } catch { }
    // Update React state immediately so the UI closes instantly
    setIncomingCall(null);
    setCallState("idle");
    setCallType("video");
    setIsMuted(false);
    setIsCameraOff(false);
    setCallError((preserveError && nextError) || preserveError ? nextError : "");

    // cleanup immediately
    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.close();
      peerRef.current = null;
    }
    // Defer hardware and peer cleanup to prevent UI blocking
    setTimeout(() => {
      try {
        peerRef.current?.getSenders().forEach((s) => s.track?.stop());
      } catch {}

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
      if (peerRef.current) {
        peerRef.current.ontrack = null;
        peerRef.current.onicecandidate = null;
        peerRef.current.close();
        peerRef.current = null;
      }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

    activeCallPeerIdRef.current = null;
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((track) => track.stop());
        remoteStreamRef.current = null;
      }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
      activeCallPeerIdRef.current = null;

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    }, 0);
  };

  const initializePeerConnection = (peerId, stream) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerRef.current = peer;
    activeCallPeerIdRef.current = peerId;

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });

    peer.ontrack = (event) => {
      const [remoteStream] = event.streams;
      remoteStreamRef.current = remoteStream;

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          to: peerId,
          candidate: event.candidate,
        });
      }
    };

    peer.onconnectionstatechange = () => {
      if (
        peer.connectionState === "disconnected" ||
        peer.connectionState === "failed" ||
        peer.connectionState === "closed"
      ) {
        cleanupCall(true, "Call disconnected");
      }
    };

    return peer;
  };

  const getLocalStream = async (type) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });

    localStreamRef.current = stream;
    setIsMuted(false);
    setIsCameraOff(type !== "video");

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    return stream;
  };

  const startCall = async (type = "video") => {
    try {
      cleanupCall(true);
      setCallType(type);
      setCallState("outgoing");
      setCallError("");

      const stream = await getLocalStream(type);
      const peer = initializePeerConnection(selected._id, stream);
      const offer = await peer.createOffer();

      await peer.setLocalDescription(offer);

      socket.emit("call-user", {
        to: selected._id,
        from: user._id,
        offer,
        callType: type,
      });
    } catch (error) {
      console.log("Error starting call:", error);
      cleanupCall(true, "Unable to start call");
      toast.error("Unable to start call");
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;

    try {
      setCallType(incomingCall.callType);
      setCallState("connecting");
      setCallError("");

      const stream = await getLocalStream(incomingCall.callType);
      const peer = initializePeerConnection(incomingCall.from, stream);

      await peer.setRemoteDescription(incomingCall.offer);

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("answer-call", {
        to: incomingCall.from,
        answer,
      });

      setIncomingCall(null);
      setCallState("active");
    } catch (error) {
      console.log("Error accepting call:", error);
      cleanupCall(true, "Unable to join call");
      toast.error("Unable to join call");
    }
  };

  const declineIncomingCall = () => {
    if (!incomingCall) return;

    socket.emit("call-declined", {
      to: incomingCall.from,
      from: user._id,
    });

    cleanupCall(false);
  };

  const endCall = () => {
    const peerId = activeCallPeerIdRef.current || incomingCall?.from || selected._id;

    if (peerId) {
      socket.emit("call-ended", {
        to: peerId,
        from: user._id,
      });
    }

    cleanupCall(false);
  };

  const toggleMute = () => {
    const audioTracks = localStreamRef.current?.getAudioTracks() || [];
    if (!audioTracks.length) return;

    const nextMuted = !isMuted;
    audioTracks.forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
  };

  const toggleCamera = () => {
    const videoTracks = localStreamRef.current?.getVideoTracks() || [];
    if (!videoTracks.length) return;

    const nextCameraOff = !isCameraOff;
    videoTracks.forEach((track) => {
      track.enabled = !nextCameraOff;
    });
    setIsCameraOff(nextCameraOff);
  };

  const showCallOverlay = callState !== "idle";
  const canToggleCamera = callType === "video" && (localStreamRef.current?.getVideoTracks()?.length || 0) > 0;
  const activeCallName =
    incomingCall && incomingCall.from !== selected._id
      ? incomingCall.username || incomingCall.displayName || incomingCall.fromName || "Incoming caller"
      : selected.displayName || selected.username;
  const activeCallInitial = activeCallName.slice(0, 1).toUpperCase();

  return (
    <section className="relative flex min-w-0 flex-1 flex-col bg-transparent">
      {fullScreenPreview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setFullScreenPreview(null)}
        >
          <button
            className="absolute right-6 top-6 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
            onClick={() => setFullScreenPreview(null)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <div
            className="relative flex h-full w-full items-center justify-center p-8 sm:p-12"
            onClick={(e) => e.stopPropagation()}
          >
            {fullScreenPreview.kind === "image" && (
              <img src={fullScreenPreview.previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
            )}
            {fullScreenPreview.kind === "video" && (
              <video src={fullScreenPreview.previewUrl} controls autoPlay className="max-h-full max-w-full rounded-lg bg-black" />
            )}
            {fullScreenPreview.kind === "pdf" && (
              <iframe src={fullScreenPreview.previewUrl} className="h-full w-full rounded-xl bg-white" title="PDF Preview" />
            )}
            {fullScreenPreview.kind === "file" && (
              <div className="flex max-w-full flex-col items-center overflow-hidden rounded-3xl bg-white p-10 text-center shadow-2xl">
                <div className="mb-4 text-5xl">📄</div>
                <p className="mb-2 w-full break-words text-xl font-bold text-slate-800">
                  {fullScreenPreview.file.name || "File Attachment"}
                </p>
                <p className="text-slate-500">
                  {formatFileSize(fullScreenPreview.file.size)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {showCallOverlay && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center bg-slate-950/78 p-4 backdrop-blur-sm">
          <div className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_28%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] text-white shadow-[0_32px_80px_rgba(2,6,23,0.55)]">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300/80">
                  {callType === "video" ? "Video Call" : "Audio Call"}
                </p>
                <h3 className="mt-2 truncate text-2xl font-semibold">
                  {activeCallName}
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  {callState === "incoming" && "Incoming call"}
                  {callState === "outgoing" && "Calling..."}
                  {callState === "connecting" && "Connecting..."}
                  {callState === "active" && "Call in progress"}
                </p>
                {callError && <p className="mt-2 text-sm text-rose-300">{callError}</p>}
              </div>

              <button
                type="button"
                onClick={endCall}
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className={`grid flex-1 min-h-0 gap-4 p-4 sm:p-6 ${callType === "video" ? "lg:grid-cols-[minmax(0,1fr)_280px]" : "lg:grid-cols-[minmax(0,1fr)_320px]"}`}>
              <div className="relative flex min-h-0 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/70">
                {callType === "video" ? (
                  <>
                    <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
                    {!remoteStreamRef.current && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-500/20 text-3xl font-semibold text-sky-100">
                          {activeCallInitial || "?"}
                        </div>
                        <p className="mt-4 text-lg font-medium text-slate-100">Waiting for video...</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20 text-4xl font-semibold text-emerald-100">
                      {activeCallInitial || "?"}
                    </div>
                    <p className="mt-5 text-2xl font-semibold">{activeCallName}</p>
                    <p className="mt-2 text-sm text-slate-300">
                      {callState === "active" ? "Audio connected" : "Waiting for response"}
                    </p>
                  </div>
                )}

                <div className="absolute bottom-4 right-4 h-28 w-24 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl sm:h-36 sm:w-28">
                  {callType === "video" && (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className={`h-full w-full object-cover ${isCameraOff ? "opacity-0" : "opacity-100"}`}
                    />
                  )}
                  {(callType !== "video" || isCameraOff) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                      You
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-[28px] border border-white/10 bg-white/5 p-4 sm:p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Controls</p>
                  <div className="mt-4 grid gap-3">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className={`inline-flex min-h-[48px] items-center justify-between rounded-2xl px-4 text-sm font-medium transition ${isMuted
                        ? "bg-amber-500/20 text-amber-100 hover:bg-amber-500/30"
                        : "bg-white/8 text-slate-100 hover:bg-white/12"
                        }`}
                    >
                      <span>{isMuted ? "Unmute" : "Mute"}</span>
                      <span>{isMuted ? "Mic off" : "Mic on"}</span>
                    </button>

                    {callType === "video" && (
                      <button
                        type="button"
                        onClick={toggleCamera}
                        disabled={!canToggleCamera}
                        className={`inline-flex min-h-[48px] items-center justify-between rounded-2xl px-4 text-sm font-medium transition ${isCameraOff
                          ? "bg-amber-500/20 text-amber-100 hover:bg-amber-500/30"
                          : "bg-white/8 text-slate-100 hover:bg-white/12"
                          } ${!canToggleCamera ? "cursor-not-allowed opacity-60" : ""}`}
                      >
                        <span>{isCameraOff ? "Turn camera on" : "Turn camera off"}</span>
                        <span>{isCameraOff ? "Video off" : "Video on"}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={endCall}
                      className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-rose-500 px-4 text-sm font-semibold text-white transition hover:bg-rose-600"
                    >
                      End call
                    </button>
                  </div>
                </div>

                {callState === "incoming" && (
                  <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/55 p-4">
                    <p className="text-sm text-slate-300">
                      {activeCallName} is calling you.
                    </p>
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={declineIncomingCall}
                        className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl bg-white/8 px-4 text-sm font-medium text-slate-100 transition hover:bg-white/12"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={acceptIncomingCall}
                        className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:bg-emerald-600"
                      >
                        Answer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-white/60 bg-white/72 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl">
        <div className="border-b border-slate-200/80 bg-white/70 px-6 py-4">
          <div className="flex items-start gap-4">
            <img
              src={
                selected?.avatar
                  ? selected.avatar
                  : `https://api.dicebear.com/7.x/initials/svg?seed=${selected?.displayName || selected?.username || "default"
                  }`
              }
              className="h-12 w-12 rounded-2xl object-cover ring-1 ring-slate-200"
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-slate-900">
                    {selected.displayName || selected.username}
                  </h2>

                  <p className={`mt-0.5 text-sm ${selected.isOnline ? "text-emerald-600" : "text-slate-500"}`}>
                    {selected.isOnline ? "Online now" : `Last seen ${formatTime(selected.lastSeen)}`}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => startCall("audio")}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                    aria-label="Start audio call"
                    title="Audio call"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h2.28a2 2 0 011.9 1.37l.82 2.46a2 2 0 01-.45 2.04l-1.27 1.27a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.04-.45l2.46.82A2 2 0 0121 16.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => startCall("video")}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                    aria-label="Start video call"
                    title="Video call"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.55-2.28A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.9L15 14m-9 4h8a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {callState !== "idle" && (
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-sky-600">
                  {callType} call {callState}
                </p>
              )}
            </div>

            <div className="relative shrink-0" ref={infoMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setNewName(selected.displayName || selected.username);
                  setShowInfoMenu((prev) => !prev);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
              >
                <span className="text-lg leading-none">...</span>
              </button>

              {showInfoMenu && (
                <div className="absolute right-0 top-12 z-20 w-[19rem] rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        selected?.avatar
                          ? selected.avatar
                          : `https://api.dicebear.com/7.x/initials/svg?seed=${selected?.displayName || selected?.username || "default"
                          }`
                      }
                      alt={selected.displayName || selected.username}
                      className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-200"
                    />

                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-900">
                        {selected.displayName || selected.username}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        @{selected.username}
                      </p>
                      <p className={`mt-1 text-xs font-medium ${selected.isOnline ? "text-emerald-600" : "text-slate-500"}`}>
                        {selected.isOnline ? "Online now" : `Last seen ${formatTime(selected.lastSeen)}`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Rename Contact
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                        placeholder="Enter display name"
                      />
                      <button
                        onClick={updateNickname}
                        className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div ref={chatRef} className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.85),rgba(255,255,255,0.96))] px-5 py-5">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/80 px-8 py-10 text-center shadow-sm">
                <p className="text-base font-medium text-slate-600">No messages yet</p>
                <p className="mt-1 text-sm text-slate-400">
                  Send a text or any file type to start the conversation.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-end min-h-full gap-3">
              {messages.map((msg, index) => {
                const showDate =
                  index === 0 ||
                  new Date(messages[index - 1].createdAt).toDateString() !==
                  new Date(msg.createdAt).toDateString();

                return (
                  <div key={msg._id}>
                    {showDate && (
                      <div className="text-center my-2 text-xs text-gray-500">
                        {formatDateLabel(msg.createdAt)}
                      </div>
                    )}

                    <Message msg={msg} myId={user._id} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200/80 bg-white/80 px-3 py-3 sm:px-5 sm:py-4">
          {!!selectedFiles.length && (
            <div className="mb-3 rounded-3xl border border-sky-100 bg-sky-50/80 p-3">
              <p className="mb-3 text-sm font-semibold text-sky-900">
                Ready to send {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {selectedFilePreviews.map(({ file, kind, previewUrl }, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-sm"
                  >
                    {kind === "image" && previewUrl && (
                      <img
                        src={previewUrl}
                        alt={file.name}
                        className="h-40 w-full cursor-pointer object-cover transition hover:opacity-90"
                        onClick={() => setFullScreenPreview({ file, kind, previewUrl })}
                      />
                    )}

                    {kind === "video" && previewUrl && (
                      <div className="group relative h-40 w-full cursor-pointer bg-black" onClick={() => setFullScreenPreview({ file, kind, previewUrl })}>
                        <video
                          src={previewUrl}
                          className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-3xl text-white opacity-80 drop-shadow-md">▶</div>
                      </div>
                    )}

                    {kind === "pdf" && (
                      <div
                        className="flex h-40 cursor-pointer items-center justify-center bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)] transition hover:opacity-90"
                        onClick={() => setFullScreenPreview({ file, kind, previewUrl })}
                      >
                        <div className="rounded-3xl border border-rose-100 bg-white px-6 py-4 text-center shadow-sm">
                          <div className="text-2xl font-bold text-rose-500">PDF</div>
                          <div className="mt-1 text-xs text-slate-500">Preview ready</div>
                        </div>
                      </div>
                    )}

                    {kind === "file" && (
                      <div className="flex h-40 items-center justify-center bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)]">
                        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-center shadow-sm">
                          <div className="text-lg font-semibold text-slate-700">FILE</div>
                          <div className="mt-1 text-xs text-slate-500">Ready to upload</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {file.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="rounded-full px-2 py-1 text-sm font-medium text-rose-500 transition hover:bg-rose-50"
                        onClick={() => removeSelectedFile(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-end gap-2 rounded-[28px] border border-slate-200 bg-slate-50/90 px-2 py-2 shadow-inner sm:items-center sm:gap-3 sm:px-3 sm:py-3">
            <div className="relative flex shrink-0 items-center gap-2" ref={fileMenuRef}>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 sm:h-11 sm:w-auto sm:px-4 sm:text-sm sm:font-medium"
                onClick={() => setShowFileTypeMenu((prev) => !prev)}
                aria-label="Attach file"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828a4 4 0 10-5.656-5.656L5.757 10.757a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {/* <span className="hidden sm:inline">Attach</span> */}
              </button>

              {showFileTypeMenu && (
                <div className="absolute bottom-14 left-0 z-30 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_40px_rgba(15,23,42,0.16)]">
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Choose file type
                  </p>
                  {fileTypeOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className="flex w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
                      onClick={() => openFilePicker(option.accept)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={fileInputAccept}
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              <div className="relative hidden sm:block" ref={emojiMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowEmoji((prev) => !prev)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl transition hover:border-sky-200 hover:bg-sky-50"
                >
                  😊
                </button>

                {showEmoji && (
                  <div className="absolute bottom-14 left-0 z-50">
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </div>
                )}
              </div>
            </div>

            <textarea
              ref={inputRef}
              className="min-h-[52px] max-h-32 min-w-0 flex-1 resize-none rounded-2xl border border-white bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-sky-200 sm:min-h-[44px] sm:h-11"
              value={text}
              rows="1"
              placeholder="Write a message..."
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleComposerSubmit();
                }
              }}
            />

            <button
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5 sm:text-sm sm:font-semibold"
              onClick={handleComposerSubmit}
              disabled={(!text.trim() && selectedFiles.length === 0) || isUploadingFiles}
              aria-label={isUploadingFiles ? "Sending" : "Send message"}
            >
              {isUploadingFiles ? (
                <span className="text-xs font-semibold sm:text-sm">...</span>
              ) : (
                <>
                  <svg className="h-4 w-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12l14-7-4 7 4 7-14-7z" />
                  </svg>
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Chat;
