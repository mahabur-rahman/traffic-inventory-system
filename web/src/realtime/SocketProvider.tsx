import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { ClientSocket } from "./socket";
import { createSocket } from "./socket";
import type { SocketConnectionState } from "../types/socket";

type SocketContextValue = {
  socket: ClientSocket | null;
  connectionState: SocketConnectionState;
};

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider(props: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<ClientSocket | null>(null);
  const [connectionState, setConnectionState] = useState<SocketConnectionState>("disconnected");

  useEffect(() => {
    const s = createSocket();
    setSocket(s);

    const onConnect = () => setConnectionState("connected");
    const onDisconnect = () => setConnectionState("disconnected");

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    s.io.on("reconnect_attempt", () => setConnectionState("reconnecting"));
    s.io.on("reconnect_error", () => setConnectionState("reconnecting"));
    s.io.on("reconnect_failed", () => setConnectionState("disconnected"));
    s.io.on("reconnect", () => setConnectionState("connected"));

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.io.off("reconnect_attempt");
      s.io.off("reconnect_error");
      s.io.off("reconnect_failed");
      s.io.off("reconnect");
      s.close();
      setSocket(null);
    };
  }, []);

  const value = useMemo(() => ({ socket, connectionState }), [socket, connectionState]);
  return <SocketContext.Provider value={value}>{props.children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocket must be used within <SocketProvider>");
  }
  return ctx;
}

