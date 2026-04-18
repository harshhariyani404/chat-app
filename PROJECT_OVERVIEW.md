# Chat App — Project overview

This document is a single reference for what the repository contains: purpose, architecture, technologies, features, APIs, real-time behavior, data models, and configuration. For day-to-day setup commands, see [README.md](./README.md).

---

## Purpose

A **full-stack real-time chat application**: users sign up and log in, see who is online, exchange direct messages with optional **file attachments**, get **delivery/read receipts**, **typing indicators**, **in-app notifications**, **contact nicknames**, **profile editing** (username + avatar), and **peer-to-peer voice/video calls** (WebRTC signaling over Socket.IO).

---

## Repository layout

| Area | Role |
|------|------|
| **Root** | Docs, `.gitignore` — no root `package.json`; frontend and backend are independent packages |
| **`client/`** | React (Vite) SPA — own `package.json`, `node_modules`, lockfile |
| **`server/`** | Express + Socket.IO API — own `package.json`, `node_modules`, lockfile |

---

## Technology stack

### Frontend (`client/`)

| Technology | Usage |
|------------|--------|
| **React 19** | UI |
| **Vite 8** | Dev server, production build |
| **Tailwind CSS 3** + PostCSS + Autoprefixer | Styling |
| **Axios** | REST API client (`/api` base path) |
| **socket.io-client** | Real-time messaging, presence, typing, calls |
| **react-hot-toast** | Notifications |
| **emoji-picker-react** | Emoji in messages |
| **ESLint 9** (flat config) | Linting |

### Backend (`server/`)

| Technology | Usage |
|------------|--------|
| **Node.js** (ES modules) | Runtime |
| **Express 5** | HTTP API |
| **Socket.IO** | WebSockets for chat, presence, WebRTC signaling |
| **Mongoose 9** | MongoDB ODM |
| **jsonwebtoken** | JWT sessions |
| **bcrypt** | Password hashing |
| **multer** | Multipart uploads to disk (`uploads/`) |
| **cloudinary** | Avatar and message attachment storage |
| **cors** | Cross-origin configuration |
| **dotenv** | Environment variables |
| **nodemon** | Dev restarts |

### Data store

- **MongoDB** via **Mongoose** (`MONGODB_URI`).

---

## Application flow (high level)

1. Unauthenticated users see **Login** or **Signup** (`App.jsx`).
2. After auth, JWT + user object are stored in **localStorage** (`client/src/lib/storage.js`).
3. **Axios** sends `Authorization: Bearer <token>` on API requests (`client/src/lib/api.js`); **401** clears the session.
4. **Home** loads the chat list, connects the socket, registers the user id, and coordinates sidebar, chat, navbar, and incoming calls.
5. Messages are persisted via REST where needed (history, uploads, edit/delete) and synchronized in real time over **Socket.IO**.

---

## Features (product)

- **Authentication**: Sign up, login; JWT-based sessions.
- **Chat list**: Users with existing conversation history (`/api/users/chat-list/:myId`).
- **User search**: Find users by query (`/api/users/search`).
- **Direct messaging**: Text, emoji, **multi-file attachments** (images, videos, documents — see server upload allowlist).
- **Message actions**: Edit, delete (including “delete for me” / soft-delete patterns per `Message` model), with API routes under `/api/messages`.
- **Receipts**: Message status **sent → delivered → seen**; `seenAt` when read.
- **Presence**: Online/offline and **last seen** updated on socket register/disconnect.
- **Typing**: `typing` / `stopTyping` between two users.
- **Notifications**: `new_notification` when a new message arrives for a background chat.
- **Profile**: Update **username** and **avatar** (avatar via Cloudinary); optional **Edit profile** UI.
- **Contact nicknames**: Per-user custom name for a contact (`/api/contacts/nickname`).
- **Voice/video calls**: WebRTC in the browser; **Socket.IO** relays offer/answer, ICE candidates, and call end/decline (see `server/sockets/chatSocket.js` and `Chat.jsx`).

---

## HTTP API summary

Base URL: `{API_BASE_URL}/api` (client: `VITE_API_URL`, default `http://localhost:5000`).

| Method & path | Auth | Purpose |
|---------------|------|---------|
| `GET /health` | No | Health check (`status`, `environment`) |
| `POST /auth/signup` | No | Register |
| `POST /auth/login` | No | Login |
| `GET /users` | Yes | List users (excluding self) |
| `GET /users/search?query=` | Yes | Search users |
| `PUT /users/profile` | Yes | Update profile (multipart: `avatar`) |
| `GET /users/status/:userId` | Yes | Online / last seen |
| `GET /users/chat-list/:myId` | Yes | Chat sidebar data |
| `GET /messages/:userId` | Yes | Message history with peer |
| `POST /messages/:userId/files` | Yes | Upload files for a chat (multipart) |
| `PUT /messages/:messageId` | Yes | Edit message |
| `DELETE /messages/:messageId` | Yes | Delete message |
| `DELETE /messages/:messageId/for-me` | Yes | Delete for current user only |
| `POST /contacts/nickname` | Yes | Save/update contact nickname |

Static: **`/uploads`** serves files from `server/uploads/` (local staging before Cloudinary where applicable).

---

## Socket.IO events (behavioral summary)

**Client → server (examples)**

- `register` — associate socket with `userId`; join room `user:<id>`; mark user online.
- `send_message` — persist message; emit to sender/receiver; optional delivered status if peer online.
- `typing` / `stopTyping` — notify peer.
- `message_seen` — mark message seen (receiver only).
- `call-user`, `answer-call`, `ice-candidate`, `call-ended`, `call-declined` — WebRTC signaling.

**Server → client (examples)**

- `receive_message`, `message_status_update`, `message_error`
- `user_online`, `user_offline`
- `new_notification`
- `incoming-call`, `call-answered`, `ice-candidate`, `call-ended`, `call-declined`

Online users are tracked in memory (`server/sockets/onlineUsers.js`).

---

## Data models (MongoDB / Mongoose)

**User** (`server/models/user.js`)

- `username` (unique), `password`, `avatar` (`url`, `publicId`), `lastSeen`, `isOnline`, timestamps.

**Message** (`server/models/message.js`)

- `from`, `to` (ObjectIds → User), `message` text, `attachments[]` (Cloudinary-oriented metadata), `isEdited`, `deletedFor`, `isDeletedForEveryone`, `status` (`sent` | `delivered` | `seen`), `seenAt`, timestamps.

**Contact** (`server/models/contact.js`)

- `user`, `contactUser`, optional `nickname` — custom display name for a contact.

---

## Security and hardening (backend)

- **JWT** required on protected routes (`authMiddleware`).
- **CORS** with configurable `ALLOWED_ORIGINS`; production restricts origins more strictly than dev (localhost/private IPs allowed in development in `server.js`).
- **Security headers** via `securityMiddleware` (e.g. `X-Frame-Options`, `X-Content-Type-Options`, `Permissions-Policy` for camera/microphone, HSTS in production).
- **Input validation** helpers (`server/utils/validation.js`) and **sanitized user payloads** (`server/utils/http.js`).
- **Express JSON** body limit (e.g. 2mb in `server.js`).
- **Upload** MIME allowlist and max size from env (`UPLOAD_MAX_FILE_SIZE_MB`).

---

## Environment variables

### Client (`client/.env`)

| Variable | Typical value | Role |
|----------|----------------|------|
| `VITE_API_URL` | `http://localhost:5000` | REST base (no trailing slash required; client trims) |
| `VITE_SOCKET_URL` | `http://localhost:5000` | Socket.IO endpoint (defaults to API URL if unset) |

### Server (`server/.env`)

| Variable | Role |
|----------|------|
| `NODE_ENV` | `development` / `production` |
| `PORT` | HTTP port (default `5000`) |
| `CLIENT_URL` | Default origin hint |
| `ALLOWED_ORIGINS` | Comma-separated origins for CORS/Socket.IO |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Signing secret for JWTs |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`) |
| `CLOUDINARY_*` | Cloud name, API key, secret for media |
| `UPLOAD_MAX_FILE_SIZE_MB` | Max upload size (default 25) |

See [README.md](./README.md) for copy-paste examples.

---

## npm scripts

Run commands **inside** each folder after `npm install` there.

| Location | Script | Action |
|----------|--------|--------|
| `client/` | `npm run dev` | Vite dev server |
| `client/` | `npm run build` | Production build → `dist/` |
| `server/` | `npm run dev` | API with nodemon |
| `server/` | `npm start` | API with Node |

---

## Frontend source map (main files)

| Path | Role |
|------|------|
| `client/src/main.jsx` | React mount |
| `client/src/App.jsx` | Auth gate, Login/Signup/Home |
| `client/src/pages/Home.jsx` | Layout: sidebar, chat, notifications, incoming call state |
| `client/src/pages/Login.jsx`, `Signup.jsx` | Auth forms |
| `client/src/components/Sidebar.jsx` | Chat list, search |
| `client/src/components/Chat.jsx` | Thread, composer, files, emoji, WebRTC UI |
| `client/src/components/Message.jsx` | Single message bubble |
| `client/src/components/Navbar.jsx` | Top bar |
| `client/src/components/EditProfile.jsx` | Profile editing |
| `client/src/socket.js` | Socket.IO client singleton |
| `client/src/lib/api.js` | Axios instance + interceptors |
| `client/src/lib/storage.js` | localStorage session |
| `client/src/lib/avatar.js` | Avatar URL helpers |
| `client/vite.config.js` | Vite config |
| `client/tailwind.config.js` | Tailwind |

---

## Backend source map (main files)

| Path | Role |
|------|------|
| `server/server.js` | Express app, HTTP server, Socket.IO, routes, CORS |
| `server/config/db.js` | MongoDB connection |
| `server/config/env.js` | Env loading |
| `server/config/cloudinary.js` | Cloudinary SDK |
| `server/sockets/chatSocket.js` | All chat/presence/call socket handlers |
| `server/sockets/onlineUsers.js` | In-memory socket id map |
| `server/routes/*.js` | Route modules |
| `server/controllers/*.js` | Request handlers |
| `server/middlewares/*.js` | Auth, errors, security, uploads |
| `server/models/*.js` | Mongoose schemas |
| `server/utils/http.js`, `server/utils/validation.js` | Shared helpers |

---

## Deployment notes (short)

- **Frontend**: Static build from `client/` (`vite build` → `dist/`); host on Vercel/Netlify or similar; set `VITE_*` at build time.
- **Backend**: Run Node on the `server/` package; set production `ALLOWED_ORIGINS`, `MONGODB_URI`, `JWT_SECRET`, and Cloudinary keys.
- In `client/`, `npm run build` produces `dist/`; in `server/`, `npm start` runs the API (see README for hosting commands).

---

*Generated as a consolidated project reference. When behavior or routes change, update this file alongside the code.*
