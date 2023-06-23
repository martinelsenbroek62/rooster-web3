import express, { Application } from "express";

class Http {
  public mount(app: Application): Application {
    app.use(express.json());
    app.enable("trust proxy");
    return app;
  }
}

export const http = new Http();
