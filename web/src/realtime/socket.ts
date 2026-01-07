import { io, type Socket } from "socket.io-client";

import { API_ORIGIN } from "../lib/env";
import type { ClientToServerEvents, ServerToClientEvents } from "../types/socket";

export type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSocket(): ClientSocket {
  return io(API_ORIGIN, {
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true
  });
}
