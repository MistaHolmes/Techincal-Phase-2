import { useState, useRef, useCallback, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
export type CallState = "idle" | "calling" | "ringing" | "connected";
export type CallType = "audio" | "video";

export interface IncomingCallInfo {
  from: string;
  callerName: string;
  callerAvatar: string;
  callType: CallType;
  offer: RTCSessionDescriptionInit;
}

interface UseWebRTCOptions {
  userId: string | null;
  userName?: string;
  userAvatar?: string;
}

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3001";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useWebRTC({ userId, userName, userAvatar }: UseWebRTCOptions) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callType, setCallType] = useState<CallType>("audio");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);
  const [callError, setCallError] = useState<string | null>(null);
  const [remoteUserName, setRemoteUserName] = useState("");
  const [remoteUserAvatar, setRemoteUserAvatar] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const targetUserIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);

  // ── WebSocket connection ──────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(`register:${userId}`);
      console.log("[WebRTC] WS connected, registered as", userId);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleSignalingMessage(msg);
      } catch {
        // Non-JSON (pong etc.)
      }
    };

    ws.onclose = () => {
      console.log("[WebRTC] WS disconnected");
    };

    // Keep-alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send("ping");
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, [userId]);

  // ── Signaling message handler ─────────────────────────────────────────────
  const handleSignalingMessage = useCallback(
    (msg: any) => {
      switch (msg.type) {
        case "incoming-call":
          setIncomingCall({
            from: msg.from,
            callerName: msg.callerName || "Unknown",
            callerAvatar: msg.callerAvatar || "",
            callType: msg.callType || "audio",
            offer: msg.offer,
          });
          setCallState("ringing");
          setRemoteUserName(msg.callerName || "Unknown");
          setRemoteUserAvatar(msg.callerAvatar || "");
          break;

        case "call-answered":
          handleCallAnswered(msg.answer);
          break;

        case "ice-candidate":
          handleRemoteIceCandidate(msg.candidate);
          break;

        case "call-ended":
          cleanup();
          break;

        case "call-rejected":
          setCallError("Call was declined");
          setTimeout(() => cleanup(), 2000);
          break;

        case "call-failed":
          setCallError(msg.reason || "Call failed");
          setTimeout(() => cleanup(), 2000);
          break;
      }
    },
    []
  );

  // ── Create peer connection ────────────────────────────────────────────────
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Remote stream setup
    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "ice-candidate",
            targetUserId: targetUserIdRef.current,
            candidate: event.candidate.toJSON(),
          })
        );
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setCallState("connected");
        startTimer();
      }
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setCallError("Connection lost");
        setTimeout(() => cleanup(), 2000);
      }
    };

    return pc;
  }, []);

  // ── Get user media ────────────────────────────────────────────────────────
  const getMedia = useCallback(async (type: CallType) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera/microphone permission denied"
          : "Could not access camera/microphone";
      setCallError(msg);
      throw err;
    }
  }, []);

  // ── Start a call (Caller side) ────────────────────────────────────────────
  const startCall = useCallback(
    async (targetUserId: string, type: CallType, targetName?: string, targetAvatar?: string) => {
      if (callState !== "idle") return;
      setCallError(null);

      try {
        targetUserIdRef.current = targetUserId;
        setCallType(type);
        setCallState("calling");
        setRemoteUserName(targetName || "");
        setRemoteUserAvatar(targetAvatar || "");

        const stream = await getMedia(type);
        const pc = createPeerConnection();

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        wsRef.current?.send(
          JSON.stringify({
            type: "call-offer",
            targetUserId,
            callerName: userName || "",
            callerAvatar: userAvatar || "",
            callType: type,
            offer: pc.localDescription,
          })
        );
      } catch {
        cleanup();
      }
    },
    [callState, userName, userAvatar, getMedia, createPeerConnection]
  );

  // ── Accept an incoming call (Callee side) ─────────────────────────────────
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    setCallError(null);

    try {
      targetUserIdRef.current = incomingCall.from;
      setCallType(incomingCall.callType);

      const stream = await getMedia(incomingCall.callType);
      const pc = createPeerConnection();

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

      // Process queued ICE candidates
      for (const candidate of iceCandidateQueue.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      iceCandidateQueue.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      wsRef.current?.send(
        JSON.stringify({
          type: "call-answer",
          targetUserId: incomingCall.from,
          answer: pc.localDescription,
        })
      );

      setIncomingCall(null);
      setCallState("connected");
      startTimer();
    } catch {
      cleanup();
    }
  }, [incomingCall, getMedia, createPeerConnection]);

  // ── Reject call ───────────────────────────────────────────────────────────
  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    wsRef.current?.send(
      JSON.stringify({
        type: "call-reject",
        targetUserId: incomingCall.from,
      })
    );
    setIncomingCall(null);
    setCallState("idle");
  }, [incomingCall]);

  // ── End call ──────────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    if (targetUserIdRef.current) {
      wsRef.current?.send(
        JSON.stringify({
          type: "call-end",
          targetUserId: targetUserIdRef.current,
        })
      );
    }
    cleanup();
  }, []);

  // ── Handle answer from callee ─────────────────────────────────────────────
  const handleCallAnswered = useCallback(async (answer: RTCSessionDescriptionInit) => {
    try {
      if (pcRef.current && pcRef.current.signalingState === "have-local-offer") {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));

        // Process queued ICE candidates
        for (const candidate of iceCandidateQueue.current) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
        iceCandidateQueue.current = [];
      }
    } catch (err) {
      console.error("[WebRTC] Error setting remote answer:", err);
    }
  }, []);

  // ── Handle remote ICE candidate ───────────────────────────────────────────
  const handleRemoteIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    try {
      if (pcRef.current && pcRef.current.remoteDescription) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        // Queue if remote description not set yet
        iceCandidateQueue.current.push(candidate);
      }
    } catch (err) {
      console.error("[WebRTC] Error adding ICE candidate:", err);
    }
  }, []);

  // ── Toggle mic ────────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((v) => !v);
  }, []);

  // ── Toggle camera ─────────────────────────────────────────────────────────
  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsCameraOff((v) => !v);
  }, []);

  // ── Call timer ────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
  }, []);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    // Stop local media tracks
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    // Close peer connection
    pcRef.current?.close();
    pcRef.current = null;

    // Clear remote stream
    remoteStreamRef.current = null;

    // Clear refs
    targetUserIdRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    // Clear timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    // Reset state
    setCallState("idle");
    setCallDuration(0);
    setIsMuted(false);
    setIsCameraOff(false);
    setIncomingCall(null);
    setCallError(null);
    iceCandidateQueue.current = [];
  }, []);

  return {
    // State
    callState,
    callType,
    isMuted,
    isCameraOff,
    callDuration,
    incomingCall,
    callError,
    remoteUserName,
    remoteUserAvatar,

    // Refs for video elements
    localVideoRef,
    remoteVideoRef,

    // Actions
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCamera,
  };
}
