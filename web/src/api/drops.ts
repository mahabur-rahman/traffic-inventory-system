import type { DropsListResponse } from "../types/drop";
import type { MyReservation, ReservationsMeResponse } from "../types/reservation";

import { get, post } from "./client";

export function getDrops() {
  return get<DropsListResponse>("/drops");
}

export function getMyReservations() {
  return get<ReservationsMeResponse>("/reservations/me");
}

export type ReserveDropResponse = {
  reservation: MyReservation;
  drop: { id: string; available_stock: number };
};

export function reserveDrop(dropId: string) {
  return post<ReserveDropResponse>(`/drops/${dropId}/reserve`);
}

export type PurchaseDropResponse = {
  purchase: { id: string; drop_id: string; user_id: string; qty: number; status: string; created_at: string | null };
  reservation: { id: string; status: string; expires_at: string | null };
};

export function purchaseDrop(dropId: string) {
  return post<PurchaseDropResponse>(`/drops/${dropId}/purchase`);
}

