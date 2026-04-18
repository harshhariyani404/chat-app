/**
 * Star-topology WebRTC: the host runs one RTCPeerConnection per guest.
 * High counts (e.g. 100) stress the host CPU, uplink, and browser limits — load-test before production.
 * Override with env MAX_MEETING_PARTICIPANTS (clamped 2–100).
 */
const CAP = 100;

export const MAX_MEETING_PARTICIPANTS = Math.min(
  CAP,
  Math.max(2, Number(process.env.MAX_MEETING_PARTICIPANTS || 100))
);
