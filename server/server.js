import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import { env, isProduction } from "./config/env.js";
import chatSocket from "./sockets/chatSocket.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import messageRoute from "./routes/messageRoute.js";
import contactRoute from "./routes/contactRoute.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";
import { applySecurityHeaders } from "./middlewares/securityMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const allowedOrigins = new Set(env.allowedOrigins);

const isPrivateIpv4Host = (hostname) => {
  if (/^127\.\d+\.\d+\.\d+$/.test(hostname)) {
    return true;
  }

  if (/^10\.\d+\.\d+\.\d+$/.test(hostname)) {
    return true;
  }

  if (/^192\.168\.\d+\.\d+$/.test(hostname)) {
    return true;
  }

  const match = hostname.match(/^172\.(\d+)\.\d+\.\d+$/);

  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
};

const isAllowedOrigin = (origin) => {
  if (!origin || allowedOrigins.has(origin)) {
    return true;
  }

  if (isProduction) {
    return false;
  }

  try {
    const url = new URL(origin);

    return url.protocol === "http:" && (url.hostname === "localhost" || isPrivateIpv4Host(url.hostname));
  } catch {
    return false;
  }
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
};

const app = express();

app.disable("x-powered-by");
app.use(applySecurityHeaders);
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", environment: env.nodeEnv });
});

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/messages", messageRoute);
app.use("/api/contacts", contactRoute);
app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  console.log(
    `[startup] env loaded: NODE_ENV=${env.nodeEnv}, PORT=${env.port}, ALLOWED_ORIGINS=${env.allowedOrigins.join(",")}`
  );

  await connectDB();

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: env.allowedOrigins,
      credentials: true,
    },
  });

  app.set("io", io);
  chatSocket(io);

  server.listen(env.port, "0.0.0.0", () => {
    console.log(`[startup] server listening on http://0.0.0.0:${env.port}`);
  });
};

startServer().catch((error) => {
  console.error("[startup] failed to start server");
  console.error(error);
  process.exit(1);
});
