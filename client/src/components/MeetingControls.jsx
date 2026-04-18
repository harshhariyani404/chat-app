const MeetingControls = ({ onToggleMic, onToggleCam, onLeave, micMuted, camOff }) => {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))] pt-8">
      <div
        className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#2d2f31]/95 px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:gap-2 sm:px-3"
        role="toolbar"
        aria-label="Meeting controls"
      >
        <button
          type="button"
          onClick={onToggleMic}
          title={micMuted ? "Turn microphone on" : "Turn microphone off"}
          aria-pressed={micMuted}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition sm:h-14 sm:w-14 ${
            micMuted
              ? "bg-[#ea4335] text-white hover:bg-[#f25448]"
              : "bg-[#3c4043] text-white hover:bg-[#4a4d51]"
          }`}
        >
          {micMuted ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3zM3 3l18 18"
              />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleCam}
          title={camOff ? "Turn camera on" : "Turn camera off"}
          aria-pressed={camOff}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition sm:h-14 sm:w-14 ${
            camOff
              ? "bg-[#ea4335] text-white hover:bg-[#f25448]"
              : "bg-[#3c4043] text-white hover:bg-[#4a4d51]"
          }`}
        >
          {camOff ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM3 3l18 18"
              />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>

        <div className="mx-1 hidden h-8 w-px bg-white/10 sm:block" aria-hidden />

        <button
          type="button"
          onClick={onLeave}
          title="Leave call"
          className="flex h-12 min-w-[4.5rem] items-center justify-center rounded-full bg-[#ea4335] px-4 text-sm font-semibold text-white shadow-lg transition hover:bg-[#f25448] sm:h-14 sm:min-w-[5.5rem]"
        >
          <span className="hidden sm:inline">Leave</span>
          <svg className="h-6 w-6 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MeetingControls;
