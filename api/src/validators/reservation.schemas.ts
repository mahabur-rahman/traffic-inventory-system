import { z } from "zod";

export const reserveParamsSchema = z.object({
  dropId: z.string().uuid()
});

export const cancelReservationParamsSchema = z.object({
  id: z.string().uuid()
});
