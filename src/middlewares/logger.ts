import { Application } from "express";
import morgan from "morgan";
import morganBody from "morgan-body";
import bodyParser from "body-parser";

class Logger {
  public mount(app: Application): Application {
    switch (process.env.MODE) {
      case "DEV":
        app.use(bodyParser.json());
        morganBody(app);
        break;
      case "PROD":
        app.use(bodyParser.json());
        morganBody(app, {
          logResponseBody: false,
          logAllResHeader: false,
        });
        break;
      default:
        app.use(morgan("tiny"));
    }
    return app;
  }
}

export const logger = new Logger();
