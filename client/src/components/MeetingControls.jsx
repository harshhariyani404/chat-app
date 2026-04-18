const MeetingControls = ({ onToggleMic, onToggleCam, onLeave, micMuted, camOff }) => {
  return (
    <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 border-t border-white/10 bg-slate-950/90 px-4 py-5 backdrop-blur-xl">
      <button
        type="button"
        onClick={onToggleMic}
        className={`inline-flex min-h-[52px] min-w-[52px] items-center justify-center rounded-2xl border px-5 text-sm font-semibold transition ${
          micMuted
            ? "border-amber-500/40 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30"
            : "border-white/15 bg-white/10 text-white hover:bg-white/15"
        }`}
      >
        {micMuted ? "Unmute" : "Mute"}
      </button>

      <button
        type="button"
        onClick={onToggleCam}
        className={`inline-flex min-h-[52px] min-w-[52px] items-center justify-center rounded-2xl border px-5 text-sm font-semibold transition ${
          camOff
            ? "border-amber-500/40 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30"
            : "border-white/15 bg-white/10 text-white hover:bg-white/15"
        }`}
      >
        {camOff ? "Camera on" : "Camera off"}
      </button>

      <button
        type="button"
        onClick={onLeave}
        className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 px-8 text-sm font-semibold text-white shadow-lg shadow-rose-900/40 transition hover:from-rose-500 hover:to-red-500"
      >
        End for me
      </button>
    </div>
  );
};

export default MeetingControls;
