import express from "express";
import { insight } from "./middlewares/insight";
import { cors, docs, errorHandler, http, logger, rateLimit, routes } from "./middlewares";

const app = express();

// Configure CORS
cors.mount(app);

// Configure http
http.mount(app);

// Configure logger
logger.mount(app);

// Configure swagger
docs.mount(app);

// Configure rate limit
rateLimit.mount(app);

// Configure routes
routes.mount(app);

// Configure error handlers
errorHandler.mount(app);

// Set port number
const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  insight.init();
  console.log("server start!");
});
