import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";

import "./index.css";
import App from "./App.tsx";
import { ToastSetup } from "./components/ToastSetup";
import { createQueryClient } from "./lib/queryClient";
import { SocketProvider } from "./realtime/SocketProvider";

const queryClient = createQueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <ToastSetup />
        <App />
      </SocketProvider>
    </QueryClientProvider>
  </StrictMode>
);
