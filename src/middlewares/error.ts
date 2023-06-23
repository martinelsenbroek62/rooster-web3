import { Application, Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { ValidateError } from "tsoa";
import OperationError from "../errorhandlers/OperationError";

interface IError {
  status?: number;
  fields?: string[];
  message?: string;
  name?: string;
}

class ErrorHandler {
  public mount = (app: Application): Application => {
    app.use(this.errorController);
    return app;
  };

  private errorController = (err: IError, _req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    const body = this.getErrorBody(err);
    res.status(body.status).json(body);
    next();
  };

  private getErrorBody = (err: unknown) => {
    if (err instanceof ValidateError) {
      return {
        message: err.message,
        status: StatusCodes.BAD_REQUEST,
        fields: err.fields,
        name: err.name,
      };
    } else if (err instanceof OperationError) {
      return {
        message: err.message,
        status: err.status,
      };
    } else {
      return {
        message: "UNKNOWN_ERROR",
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }
  };
}

export const errorHandler = new ErrorHandler();
