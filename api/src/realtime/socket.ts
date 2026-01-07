import type { Server as HttpServer } from "node:http";

import { Server } from "socket.io";

import { env } from "../config/env";
import { logger } from "../logger";

let io: Server | null = null;

const DROPS_ROOM = "drops";

function emitGlobal(event: string, payload: unknown) {
  if (!io) return;
  io.to(DROPS_ROOM).emit(event, payload);
}

function emitForDrop(dropId: string, event: string, payload: unknown) {
  if (!io) return;
  io.to(DROPS_ROOM).emit(event, payload);
  io.to(`drop:${dropId}`).emit(event, payload);
}

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigins.includes("*") ? "*" : env.corsOrigins,
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    // Default subscription: all clients in a global drops room
    socket.join(DROPS_ROOM);

    // Optional: per-drop rooms for more targeted updates
    socket.on("drops:join", (payload: { dropId?: string }) => {
      if (payload?.dropId) socket.join(`drop:${payload.dropId}`);
    });
    socket.on("drops:leave", (payload: { dropId?: string }) => {
      if (payload?.dropId) socket.leave(`drop:${payload.dropId}`);
    });

    socket.on("disconnect", (reason) => {
      logger.info({ socketId: socket.id, reason }, "Socket disconnected");
    });
  });

  return io;
}

export function emitDropCreated(payload: { drop: unknown }) {
  emitGlobal("DROP_CREATED", payload);
  emitGlobal("drop:created", payload);
}

export function emitStockUpdated(payload: { dropId: string; availableStock: number }) {
  emitForDrop(payload.dropId, "STOCK_UPDATED", payload);
  emitForDrop(payload.dropId, "drop:stock_updated", payload);
}

export function emitReservationExpired(payload: { dropId: string; reservationId: string }) {
  emitForDrop(payload.dropId, "RESERVATION_EXPIRED", payload);
  emitForDrop(payload.dropId, "reservation:expired", payload);
}

export function emitPurchaseCompleted(payload: {
  dropId: string;
  username: string | null;
  purchasedAt: string;
}) {
  emitForDrop(payload.dropId, "PURCHASE_COMPLETED", payload);
  emitForDrop(payload.dropId, "purchase:completed", payload);
}

export function emitActivityUpdated(payload: {
  dropId: string;
  latestPurchasers: Array<{ userId: string; username: string; qty: number; createdAt: string }>;
}) {
  emitForDrop(payload.dropId, "ACTIVITY_UPDATED", payload);
  emitForDrop(payload.dropId, "drop:activity_updated", payload);
}

// Backwards-compatible aliases (internal code may still import these names)
export const emitDropStockUpdated = emitStockUpdated;
export const emitDropActivityUpdated = emitActivityUpdated;
