import { useEffect, useMemo, useState } from "react";

import type { ClientSocket } from "../realtime/socket";
import { createSocket } from "../realtime/socket";
import type { SocketConnectionState } from "../types/socket";

export function useSocket() {
  const [socket, setSocket] = useState<ClientSocket | null>(null);
  const [state, setState] = useState<SocketConnectionState>("disconnected");

  useEffect(() => {
    const socket = createSocket();
    setSocket(socket);

    const setConnected = () => setState("connected");
    const setDisconnected = () => setState("disconnected");

    socket.on("connect", setConnected);
    socket.on("disconnect", setDisconnected);

    socket.io.on("reconnect_attempt", () => setState("reconnecting"));
    socket.io.on("reconnect_error", () => setState("reconnecting"));
    socket.io.on("reconnect_failed", () => setState("disconnected"));
    socket.io.on("reconnect", () => setState("connected"));

    return () => {
      socket.off("connect", setConnected);
      socket.off("disconnect", setDisconnected);
      socket.io.off("reconnect_attempt");
      socket.io.off("reconnect_error");
      socket.io.off("reconnect_failed");
      socket.io.off("reconnect");
      socket.close();
      setSocket(null);
    };
  }, []);

  return useMemo(
    () => ({
      socket,
      connectionState: state
    }),
    [socket, state]
  );
}
