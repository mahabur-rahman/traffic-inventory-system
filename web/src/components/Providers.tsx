import { Provider as ReduxProvider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";

import { store } from "../store/store";
import { createQueryClient } from "../lib/queryClient";
import { SocketProvider } from "../realtime/SocketProvider";
import { ToastSetup } from "./ToastSetup";

const queryClient = createQueryClient();

export function Providers(props: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <ToastSetup />
          {props.children}
        </SocketProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}

