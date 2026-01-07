import type { Server as HttpServer } from "node:http";

import { Server } from "socket.io";

import { logger } from "../logger";

let io: Server | null = null;

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");
    socket.on("disconnect", (reason) => {
      logger.info({ socketId: socket.id, reason }, "Socket disconnected");
    });
  });

  return io;
}

export function emitDropStockUpdated(payload: { dropId: string; availableStock: number }) {
  if (!io) return;
  io.emit("drop:stock_updated", payload);
}

export function emitDropActivityUpdated(payload: {
  dropId: string;
  latestPurchasers: Array<{ userId: string; username: string; qty: number; createdAt: string }>;
}) {
  if (!io) return;
  io.emit("drop:activity_updated", payload);
}

