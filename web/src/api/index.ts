import type { DropsListResponse } from "../types/drop";
import type { MyReservation, ReservationsMeResponse } from "../types/reservation";
import type { Purchase } from "../types/purchase";

import { apiGet, apiPost } from "./client";

export type { Drop, LatestPurchaser, DropsListResponse } from "../types/drop";
export type { MyReservation, ReservationsMeResponse } from "../types/reservation";
export type { Purchase } from "../types/purchase";
export { ApiError } from "../types/api";
export { normalizeUiErrorCode, type UiErrorCode } from "./errors";

export function getDrops() {
  return apiGet<DropsListResponse>("/drops");
}

export function getMyReservations() {
  return apiGet<ReservationsMeResponse>("/reservations/me");
}

export type ReserveDropResponse = {
  reservation: MyReservation;
  drop: { id: string; available_stock: number };
};

export function reserveDrop(dropId: string) {
  return apiPost<ReserveDropResponse>(`/drops/${dropId}/reserve`);
}

export type PurchaseDropResponse = {
  purchase: Purchase;
  reservation: { id: string; status: string; expires_at: string | null };
};

export function purchaseDrop(dropId: string) {
  return apiPost<PurchaseDropResponse>(`/drops/${dropId}/purchase`);
}

