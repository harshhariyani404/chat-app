import { io } from "socket.io-client";
import { SOCKET_URL } from "./config/env";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
});
