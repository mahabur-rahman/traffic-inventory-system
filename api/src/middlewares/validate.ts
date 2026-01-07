import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ZodError } from "zod";

import { ApiError } from "../utils/apiError";

type Schemas = Partial<{
  body: ZodTypeAny;
  query: ZodTypeAny;
  params: ZodTypeAny;
}>;

export function validate(schemas: Schemas): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(
          new ApiError({
            statusCode: 422,
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: err.flatten()
          })
        );
      }
      return next(err);
    }
  };
}

