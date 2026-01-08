import { z } from "zod";

export const dropStatusEnum = z.enum(["draft", "scheduled", "live", "ended", "cancelled"]);

export const createDropBodySchema = z
  .object({
    name: z.string().trim().min(2).max(200),
    price: z.number().int().min(0),
    currency: z
      .string()
      .trim()
      .length(3)
      .transform((v) => v.toUpperCase())
      .optional(),
    total_stock: z.number().int().min(0),
    starts_at: z.coerce.date().optional().nullable(),
    ends_at: z.coerce.date().optional().nullable(),
    status: dropStatusEnum.optional()
  })
  .superRefine((data, ctx) => {
    if (data.starts_at && Number.isNaN(data.starts_at.getTime())) {
      ctx.addIssue({ code: "custom", path: ["starts_at"], message: "Invalid starts_at" });
    }
    if (data.ends_at && Number.isNaN(data.ends_at.getTime())) {
      ctx.addIssue({ code: "custom", path: ["ends_at"], message: "Invalid ends_at" });
    }
    if (data.starts_at && data.ends_at && data.ends_at <= data.starts_at) {
      ctx.addIssue({
        code: "custom",
        path: ["ends_at"],
        message: "ends_at must be after starts_at"
      });
    }
    if (data.status === "scheduled" && !data.starts_at) {
      ctx.addIssue({
        code: "custom",
        path: ["starts_at"],
        message: "starts_at is required when status is scheduled"
      });
    }
  });

export const listDropsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});
