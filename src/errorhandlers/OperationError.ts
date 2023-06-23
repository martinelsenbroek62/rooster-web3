import { StatusCodes } from "http-status-codes";

class OperationError extends Error {
  constructor(readonly status: StatusCodes) {
    super(StatusCodes[status]);
  }
}

export default OperationError;
