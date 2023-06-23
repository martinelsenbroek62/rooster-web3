import { Application } from "express";
import { rateLimit as expressRateLimit } from "express-rate-limit";

class RateLimit {
  public mount = (app: Application) => {
    const limiter = expressRateLimit({
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60 * 1000),
      max: Number(process.env.RATE_LIMIT_MAX || 100),
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use(limiter);
    return app;
  };
}

export const rateLimit = new RateLimit();
