import { Application, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";

class Docs {
  public mount = (app: Application): Application => {
    app.use("/docs", swaggerUi.serve, this.swaggerUiGenerator);
    return app;
  };

  private swaggerUiGenerator = async (_req: Request, res: Response) => {
    return res.send(swaggerUi.generateHTML(await import("../../build/swagger.json")));
  };
}

export const docs = new Docs();
