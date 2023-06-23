import configureCors, { CorsOptions } from "cors";
import { Application } from "express";

class Cors {
  public mount(app: Application): Application {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",");
    if (allowedOrigins[0] !== "") {
      const options: CorsOptions = {
        origin: allowedOrigins,
      };
      app.use(configureCors(options));
    } else {
      app.use(configureCors());
    }
    return app;
  }
}

export const cors = new Cors();
