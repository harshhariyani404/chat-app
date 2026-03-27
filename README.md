# Chat App

Production-ready full-stack chat application with a React + Vite frontend and an Express + Socket.IO backend.

## Project structure

```text
chat-app/
|-- client/
|   |-- src/
|   |-- .env
|   |-- .env.example
|   `-- package.json
|-- server/
|   |-- config/
|   |-- controllers/
|   |-- middlewares/
|   |-- models/
|   |-- routes/
|   |-- sockets/
|   |-- utils/
|   |-- .env
|   |-- .env.example
|   `-- package.json
|-- .gitignore
|-- package.json
`-- README.md
```

## Environment variables

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

1. Run `npm install` from the repo root.
2. Copy `client/.env.example` to `client/.env` if needed.
3. Copy `server/.env.example` to `server/.env` and fill in real secrets.
4. Start the backend with `npm run dev:server`.
5. Start the frontend with `npm run dev:client`.

## Production commands

- `npm run build`
- `npm start`

`npm start` runs the Express backend. For frontend hosting on Vercel or Netlify, deploy the `client/` directory separately using:

- Build command: `npm run build`
- Publish directory: `dist`

For Render backend deployment, deploy the `server/` directory or the repo root with:

- Build command: `npm install && npm run build`
- Start command: `npm start`

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
