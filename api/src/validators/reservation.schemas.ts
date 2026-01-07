import { z } from "zod";

export const reserveParamsSchema = z.object({
  dropId: z.string().uuid()
});

