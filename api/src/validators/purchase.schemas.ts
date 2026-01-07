import { z } from "zod";

export const purchaseParamsSchema = z.object({
  dropId: z.string().uuid()
});

