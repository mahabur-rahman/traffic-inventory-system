export type SocketConnectionState = "connected" | "reconnecting" | "disconnected";

export type ServerToClientEvents = {
  DROP_CREATED: (payload: { drop: unknown }) => void;
  STOCK_UPDATED: (payload: { dropId: string; availableStock: number }) => void;
  RESERVATION_EXPIRED: (payload: { dropId: string; reservationId: string }) => void;
  PURCHASE_COMPLETED: (payload: { dropId: string; username: string | null; purchasedAt: string }) => void;
  ACTIVITY_UPDATED: (payload: {
    dropId: string;
    latestPurchasers: Array<{ userId: string; username: string; qty: number; createdAt: string }>;
  }) => void;
};

export type ClientToServerEvents = {
  "drops:join": (payload: { dropId: string }) => void;
  "drops:leave": (payload: { dropId: string }) => void;
};
