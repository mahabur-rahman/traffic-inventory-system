import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App.tsx";
import { ToastSetup } from "./components/ToastSetup";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastSetup />
    <App />
  </StrictMode>
);
