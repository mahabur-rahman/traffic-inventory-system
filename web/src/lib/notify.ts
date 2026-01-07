import toast from "react-hot-toast";

import { normalizeError } from "./errors";

const baseStyle: React.CSSProperties = {
  background: "#09090b",
  color: "#fafafa",
  border: "1px solid #27272a"
};

export function notifySuccess(message: string) {
  toast.success(message, { style: baseStyle });
}

export function notifyInfo(message: string) {
  toast(message, { style: baseStyle });
}

export function notifyWarning(message: string) {
  toast(message, { style: { ...baseStyle, border: "1px solid #a16207" } });
}

export function notifyError(err: unknown) {
  const e = normalizeError(err);
  const message = `${e.title}: ${e.message}`;

  if (e.code === "OUT_OF_STOCK") return notifyWarning(message);
  if (e.code === "RESERVATION_EXPIRED") return notifyInfo(message);
  if (e.code === "ALREADY_RESERVED") return notifyInfo(message);
  if (e.code === "CONFLICT") return toast.error(message, { style: baseStyle });

  return toast.error(message, { style: baseStyle });
}

