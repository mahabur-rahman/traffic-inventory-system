const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const routes = require("./routes");
const { notFound } = require("./middlewares/notFound");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.use(routes);

app.use(notFound);
app.use(errorHandler);

module.exports = { app };

