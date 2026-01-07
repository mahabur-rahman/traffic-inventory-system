import { Toaster } from "react-hot-toast";

export function ToastSetup() {
  return <Toaster position="top-right" toastOptions={{ duration: 3500 }} />;
}

