import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import type { RequestHandler } from "express";

import routes from "./routes/index";
import { loadUser } from "./middlewares/auth";
import { errorHandler } from "./middlewares/errorHandler";
import { httpLogger } from "./middlewares/httpLogger";
import { notFound } from "./middlewares/notFound";
import { requestContext } from "./middlewares/requestContext";
import { asyncHandler } from "./utils/asyncHandler";

export const app = express();

app.use(httpLogger);
app.use(requestContext);
app.use(helmet() as unknown as RequestHandler);
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "1mb" }) as unknown as RequestHandler);
app.use(asyncHandler(loadUser));

app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);
