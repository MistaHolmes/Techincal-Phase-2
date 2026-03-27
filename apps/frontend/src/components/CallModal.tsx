import { useEffect } from "react";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  X,
} from "lucide-react";
import type { CallState, CallType, IncomingCallInfo } from "../hooks/useWebRTC";

interface CallModalProps {
  callState: CallState;
  callType: CallType;
  isMuted: boolean;
  isCameraOff: boolean;
  callDuration: number;
  incomingCall: IncomingCallInfo | null;
  callError: string | null;
  remoteUserName: string;
  remoteUserAvatar: string;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMic: () => void;
  onToggleCamera: () => void;
}

const formatDuration = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
};

const CallModal = ({
  callState,
  callType,
  isMuted,
  isCameraOff,
  callDuration,
  incomingCall,
  callError,
  remoteUserName,
  remoteUserAvatar,
  localVideoRef,
  remoteVideoRef,
  onAccept,
  onReject,
  onEnd,
  onToggleMic,
  onToggleCamera,
}: CallModalProps) => {
  // Play ringtone effect (browser beep)
  useEffect(() => {
    if (callState !== "ringing") return;
    let ctx: AudioContext | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;

    try {
      ctx = new AudioContext();
      const playBeep = () => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 440;
        gain.gain.value = 0.15;
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      };
      playBeep();
      interval = setInterval(playBeep, 2000);
    } catch {}

    return () => {
      if (interval) clearInterval(interval);
      if (ctx) ctx.close().catch(() => {});
    };
  }, [callState]);

  if (callState === "idle") return null;

  const avatarUrl =
    remoteUserAvatar ||
    (incomingCall?.callerAvatar) ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=user`;
  const name = remoteUserName || incomingCall?.callerName || "Unknown";
  const isVideo = callType === "video" || incomingCall?.callType === "video";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-950/95 backdrop-blur-xl" />

      {/* Remote video (full screen when connected + video) */}
      {callState === "connected" && isVideo && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full h-full">
        {/* ── RINGING: Incoming call ── */}
        {callState === "ringing" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
            {/* Animated avatar */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-violet-500/20 animate-ping" />
              <div className="absolute -inset-2 rounded-full bg-violet-500/30 animate-pulse" />
              <img
                src={avatarUrl}
                alt=""
                className="w-28 h-28 rounded-full object-cover ring-4 ring-violet-500 relative z-10"
              />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-1">{name}</h2>
              <p className="text-violet-300 text-sm font-medium animate-pulse">
                {isVideo ? "Incoming video call..." : "Incoming voice call..."}
              </p>
            </div>

            {/* Accept / Reject */}
            <div className="flex items-center gap-8 mt-8">
              <button
                onClick={onReject}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-xl shadow-red-500/30 transition-all active:scale-95"
              >
                <PhoneOff size={24} />
              </button>
              <button
                onClick={onAccept}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-xl shadow-green-500/30 transition-all active:scale-95 animate-bounce"
              >
                {isVideo ? <Video size={24} /> : <Phone size={24} />}
              </button>
            </div>
          </div>
        )}

        {/* ── CALLING: Outgoing call ── */}
        {callState === "calling" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
            <div className="relative">
              <div className="absolute -inset-3 rounded-full border-2 border-violet-500/40 animate-ping" />
              <img
                src={avatarUrl}
                alt=""
                className="w-28 h-28 rounded-full object-cover ring-4 ring-violet-500/50"
              />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-1">{name}</h2>
              {callError ? (
                <p className="text-red-400 text-sm font-medium">{callError}</p>
              ) : (
                <p className="text-gray-400 text-sm font-medium">
                  {isVideo ? "Calling with video..." : "Calling..."}
                </p>
              )}
            </div>

            {/* Local preview for video calls */}
            {isVideo && (
              <div className="w-48 h-36 rounded-2xl overflow-hidden bg-gray-800 border border-gray-700 shadow-xl mt-4">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                  style={{ transform: "scaleX(-1)" }}
                />
              </div>
            )}

            <button
              onClick={onEnd}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-xl shadow-red-500/30 transition-all active:scale-95 mt-8"
            >
              <PhoneOff size={24} />
            </button>
          </div>
        )}

        {/* ── CONNECTED: Active call ── */}
        {callState === "connected" && (
          <>
            {/* Top bar */}
            <div className="w-full flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                {!isVideo && (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-green-500"
                  />
                )}
                <div>
                  <h3 className="text-white font-bold text-sm">{name}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-400 text-xs font-mono tabular-nums">
                      {formatDuration(callDuration)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Audio call center view */}
            {!isVideo && (
              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="relative">
                  <div className="absolute -inset-3 rounded-full bg-green-500/10 animate-pulse" />
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-32 h-32 rounded-full object-cover ring-4 ring-green-500/30"
                  />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">{name}</h2>
                  <p className="text-green-400 text-sm font-mono tabular-nums mt-1">
                    {formatDuration(callDuration)}
                  </p>
                </div>

                {/* Audio visualizer bars */}
                <div className="flex items-end gap-1 h-8 mt-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-violet-500 rounded-full"
                      style={{
                        height: `${Math.random() * 100}%`,
                        animation: `audioBar 0.5s ease-in-out ${i * 0.05}s infinite alternate`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Local PiP for video */}
            {isVideo && (
              <>
                <div className="flex-1" />
                <div className="absolute top-20 right-6 w-36 h-48 rounded-2xl overflow-hidden bg-gray-800 border-2 border-gray-700 shadow-2xl z-20">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                  {isCameraOff && (
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                      <VideoOff size={20} className="text-gray-500" />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Control bar */}
            <div className="w-full px-6 pb-10 pt-4">
              <div className="max-w-xs mx-auto flex items-center justify-center gap-5 bg-gray-900/80 backdrop-blur-md px-6 py-4 rounded-full border border-gray-800">
                {/* Mute */}
                <button
                  onClick={onToggleMic}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                    isMuted
                      ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/30"
                      : "bg-gray-800 text-white hover:bg-gray-700"
                  }`}
                >
                  {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                {/* Camera toggle (video calls only) */}
                {isVideo && (
                  <button
                    onClick={onToggleCamera}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                      isCameraOff
                        ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/30"
                        : "bg-gray-800 text-white hover:bg-gray-700"
                    }`}
                  >
                    {isCameraOff ? <VideoOff size={18} /> : <Video size={18} />}
                  </button>
                )}

                {/* End call */}
                <button
                  onClick={onEnd}
                  className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-xl shadow-red-500/30 transition-all active:scale-95"
                >
                  <PhoneOff size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* CSS for audio visualizer */}
      <style>{`
        @keyframes audioBar {
          0% { height: 15%; }
          100% { height: 90%; }
        }
      `}</style>
    </div>
  );
};

export default CallModal;
