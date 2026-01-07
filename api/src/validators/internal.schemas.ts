import { z } from "zod";

export const createUserBodySchema = z.object({
  username: z.string().trim().min(3).max(50)
});

