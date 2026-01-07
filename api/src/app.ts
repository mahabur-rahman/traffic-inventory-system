import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import routes from "./routes/index";
import { loadUser } from "./middlewares/auth";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";
import { requestId } from "./middlewares/requestId";

export const app = express();

app.use(requestId);
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(loadUser);

app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);
