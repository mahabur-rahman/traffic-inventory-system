import toast from "react-hot-toast";

import { normalizeError } from "./errors";
import { normalizeUiErrorCode } from "../api";

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

  if (e.code === "ALREADY_RESERVED") return notifyInfo("Already reserved");
  if (e.code === "RESERVATION_REQUIRED") return notifyInfo("Reserve first, then purchase");
  if (e.code === "RESERVATION_EXPIRED") return notifyInfo(message);

  const uiCode = normalizeUiErrorCode(e.code);
  if (uiCode === "OUT_OF_STOCK") return notifyWarning("Someone else reserved it first");
  if (uiCode === "DROP_NOT_ACTIVE") return notifyWarning(message);
  if (uiCode === "CONFLICT") return notifyWarning("Someone else reserved it first");
  if (uiCode === "VALIDATION_ERROR") return toast.error(message, { style: baseStyle });
  if (uiCode === "UNAUTHORIZED") return notifyInfo("Sign in to continue");
  if (uiCode === "NETWORK_ERROR") return toast.error(message, { style: baseStyle });

  return toast.error(message, { style: baseStyle });
}
