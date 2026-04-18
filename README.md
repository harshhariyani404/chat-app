# Chat App

Production-ready full-stack chat application with a React + Vite frontend and an Express + Socket.IO backend.

## Project structure

```text
chat-app/
|-- client/          # Frontend — own package.json, node_modules, lockfile
|   |-- src/
|   |-- .env
|   |-- .env.example
|   `-- package.json
|-- server/          # Backend — own package.json, node_modules, lockfile
|   |-- config/
|   |-- controllers/
|   |-- ...
|   |-- .env
|   |-- .env.example
|   `-- package.json
|-- .gitignore
`-- README.md
```

## Environment variables

Use real files at **`client/.env`** and **`server/.env`** (they stay in those folders; only a root-level `.env` is git-ignored). For new setups, copy from each folder’s `.env.example`.

Frontend in `client/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

Backend in `server/.env`:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/chatApp
JWT_SECRET=replace-with-a-secure-random-secret
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
UPLOAD_MAX_FILE_SIZE_MB=25
```

## Local development

1. **API:** `cd server` → `npm install` → copy `server/.env.example` to `server/.env` → `npm run dev`
2. **UI:** `cd client` → `npm install` → copy `client/.env.example` to `client/.env` → `npm run dev`

There is no root `package.json`; install and run inside each folder.

## Production / deploy (separate hosts)

**Frontend (e.g. Vercel)** — set project root to `client/`:

- Install: `npm install`
- Build: `npm run build`
- Output: `dist/`

**Backend (e.g. Render)** — set project root to `server/`:

- Build: `npm install` (or `npm ci`)
- Start: `npm start`

## Production improvements included

- Centralized frontend API and socket configuration
- Frontend session persistence helpers
- Backend environment-based configuration
- JWT auth hardening with bearer token support
- Safer CORS and security headers
- Input validation for auth, ids, and search
- Sanitized API responses without password leakage
- Improved profile/avatar handling and message API errors
- Fixed socket event mismatch for call teardown
