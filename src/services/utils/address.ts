import { getAddress, isAddress } from "ethers/lib/utils";
import { StatusCodes } from "http-status-codes";
import OperationError from "../../errorhandlers/OperationError";

export const getValidAddress = (address: string): string => {
  if (!isAddress(address)) {
    throw new OperationError(StatusCodes.NOT_ACCEPTABLE);
  }
  return getAddress(address);
};
