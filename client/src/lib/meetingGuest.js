const key = (meetingId) => `meetingGuest:${meetingId}`;

export const readMeetingGuest = (meetingId) => {
  if (!meetingId) return null;
  try {
    const raw = sessionStorage.getItem(key(meetingId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.guestId || !data?.displayName) return null;
    return data;
  } catch {
    return null;
  }
};

export const writeMeetingGuest = (meetingId, { guestId, displayName }) => {
  if (!meetingId || !guestId || !displayName) return;
  sessionStorage.setItem(key(meetingId), JSON.stringify({ guestId, displayName }));
};

export const clearMeetingGuest = (meetingId) => {
  if (!meetingId) return;
  sessionStorage.removeItem(key(meetingId));
};
