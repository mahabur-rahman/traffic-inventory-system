import type { Drop, DropsListResponse } from "../types/drop";
import type { MyReservation, ReservationsMeResponse } from "../types/reservation";
import type { Purchase } from "../types/purchase";

import { apiDelete, apiGet, apiPost } from "./client";

export type { Drop, LatestPurchaser, DropsListResponse } from "../types/drop";
export type { MyReservation, ReservationsMeResponse } from "../types/reservation";
export type { Purchase } from "../types/purchase";
export { ApiError } from "../types/api";
export { normalizeUiErrorCode, type UiErrorCode } from "./errors";

export type HealthResponse = {
  service: "api";
  uptime: number;
  db: "up" | "down" | "not_configured";
};

export function getHealth() {
  return apiGet<HealthResponse>("/health");
}

export type MeResponse = {
  user: { id: string; username?: string | null };
};

export function getMe() {
  return apiGet<MeResponse>("/me");
}

export function getDrops() {
  return apiGet<DropsListResponse>("/drops");
}

// Prompt aliases
export const fetchDrops = getDrops;

export function getMyReservations() {
  return apiGet<ReservationsMeResponse>("/reservations/me");
}

export const fetchMyReservations = getMyReservations;

export type CreateDropInput = {
  name: string;
  price: number;
  total_stock: number;
  starts_at?: string | null;
  ends_at?: string | null;
  status?: "draft" | "scheduled" | "live" | "ended" | "cancelled";
};

export function createDrop(input: CreateDropInput) {
  return apiPost<Drop>("/drops", input);
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

export type CancelReservationResponse = {
  reservationId: string;
  dropId: string;
  availableStock: number | null;
  status: string;
};

export function cancelReservation(reservationId: string) {
  return apiDelete<CancelReservationResponse>(`/reservations/${reservationId}/cancel`);
}
