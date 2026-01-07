export type MyReservation = {
  id: string;
  drop_id: string;
  status: string;
  expires_at: string | null;
  created_at: string | null;
};

export type ReservationsMeResponse = {
  items: MyReservation[];
};

