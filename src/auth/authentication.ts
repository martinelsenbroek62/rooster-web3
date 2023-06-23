import { Request } from "express";
import { JwtPayload, verify } from "jsonwebtoken";
import OperationError from "../errorhandlers/OperationError";
import { StatusCodes } from "http-status-codes";

interface Decoded extends JwtPayload {
  role: string;
}

/* eslint-disable @typescript-eslint/require-await */
export const expressAuthentication = async (
  request: Request,
  securityName: string,
  roles?: string[],
): Promise<void> => {
  switch (securityName) {
    case "apiKey": {
      const apiKey = request.headers["x-api-key"];
      if (typeof apiKey !== "string") {
        throw new OperationError(StatusCodes.UNAUTHORIZED);
      }
      if (apiKey !== process.env.API_KEY) {
        throw new OperationError(StatusCodes.UNAUTHORIZED);
      }
      break;
    }
    case "bearer": {
      try {
        const bearToken = request.headers["authorization"];
        if (!bearToken) {
          throw new OperationError(StatusCodes.UNAUTHORIZED);
        }
        const token = bearToken.split(" ")[1];
        const decoded = verify(token, process.env.SECRET || "") as Decoded;
        if (roles) {
          if (!roles.includes(decoded.role)) {
            throw new OperationError(StatusCodes.UNAUTHORIZED);
          }
        }
      } catch (error: any) {
        throw new OperationError(StatusCodes.UNAUTHORIZED);
      }
      break;
    }
    default:
      throw new OperationError(StatusCodes.INTERNAL_SERVER_ERROR);
  }
};
