# Group chat & meetings — integration guide

This document explains what was added and how to run and deploy it without breaking existing one-to-one chat and calls.

## What was added

### Backend

- **Models:** `server/models/group.js`, `groupMessage.js`, `meeting.js`
- **REST:** `GET/POST /api/groups`, `GET /api/groups/:groupId/messages`, member routes, `POST/GET /api/meetings`, `GET /api/meetings/:meetingId`
- **Sockets:** `server/sockets/groupMeetingSocket.js`, wired from `chatSocket.js` via `setupGroupMeetingListeners`

### Socket events (new)

| Event | Direction | Purpose |
| --- | --- | --- |
| `join-group` / `leave-group` | Client → server | Join/leave Socket.IO room `group:<id>` |
| `group-message` | Client → server → room | Persist + broadcast group messages |
| `group-typing` | Client → server → room | Typing indicator |
| `create-meeting` | Client → server | Optional socket path to create a meeting |
| `join-meeting` / `leave-meeting` | Client → server | Join room `meeting:<id>`, update DB |
| `meeting-users-update` | Server → clients | Participant list refresh |
| `meeting-ended` | Server → room | Host left or meeting closed |
| `meeting-offer` / `meeting-answer` / `meeting-ice-candidate` | Client ↔ client (via server) | Star WebRTC signaling (separate from 1:1 `call-user` / `ice-candidate`) |

One-to-one call events in `chatSocket.js` are unchanged.

### Frontend

- **Router:** `react-router-dom` — `/meeting/:meetingId` opens `MeetingRoom.jsx`; everything else uses `Home.jsx`
- **Pages:** `GroupChat.jsx`, `MeetingRoom.jsx`
- **Components:** `VideoGrid.jsx`, `MeetingControls.jsx`
- **Hook:** `hooks/useStarMeeting.js` (star topology WebRTC)
- **Shared ICE list:** `lib/webrtcConfig.js`

## Local development

1. **MongoDB** running and `MONGODB_URI` set in `server/.env`.
2. **Backend:** `cd server` → `npm install` → `npm run dev`
3. **Frontend:** `cd client` → `npm install` → `npm run dev`
4. **Client env:** `client/.env` should point `VITE_API_URL` / `VITE_SOCKET_URL` at your API (e.g. `http://localhost:5000`).

There is no root `package.json`; each app has its own `node_modules` and lockfile.

## Feature checks

### Groups

1. Open sidebar → **Groups** → **Create group**.
2. Name the group, search users, add members, **Create**.
3. Open the group thread and send messages; open the same group in another browser/user and confirm real-time delivery and sender names.

### Meetings (star WebRTC)

1. Sidebar → **Meetings** → **Create meeting** (link is copied; you are navigated to `/meeting/<id>`).
2. In another browser (logged in as another user), open the copied URL or navigate manually to `/meeting/<sameId>`.
3. Allow camera/mic; you should see remote video on the host (center) and guests connected only to the host (not mesh).
4. **Capacity:** `MAX_MEETING_PARTICIPANTS` in `server/.env` (default **12**, clamped **2–100**). Example: `MAX_MEETING_PARTICIPANTS=100`. The meeting header shows **connected / max**. When full, new joins are rejected with `MEETING_FULL`.
5. **Video grid:** Up to **6** tiles per page; use **Previous / Next** when there are more than six participants. Use **People** to open the participant list (toggle); on small screens it overlays; on large screens it sits beside the video area.

### Group settings (admin)

1. Open a group thread → **gear** (settings).
2. **Creator** can search users, **add** members, and **remove** others; members see a read-only list. Leaving or deleting updates the sidebar when wired from `Home.jsx`.

## Deploy notes

- **Render / similar (API):** deploy server; ensure new routes are included; no extra build step beyond `npm install` and `npm start` (or your process manager).
- **Vercel / static host (client):** build `client` with `VITE_API_URL` and `VITE_SOCKET_URL` set to your public API origin. React Router uses `BrowserRouter`; configure SPA fallback so `/meeting/*` serves `index.html`.
- **CORS / Socket.IO:** production `ALLOWED_ORIGINS` must include your Vercel URL (see `deployment-links.env`).

## Troubleshooting

- **Vite: `ENOENT` … missing `react` / `react-dom`:** run `npm install` inside **`client/`** (not the repo root). Close the dev server first if Windows reports `EPERM` on native modules.
- **CORS on preflight:** ensure deployed API allows your front-end origin (and localhost for dev).
- **WebRTC black video:** check TURN/STUN (`webrtcConfig.js`); restrictive NATs may need your own TURN.
- **Socket not registered on meeting page:** `MeetingRoom` calls `register` on connect; ensure the same JWT/session is used as on Home.
