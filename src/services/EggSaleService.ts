import { Signature } from "ethers";
import { getAddress, hexlify, randomBytes, solidityKeccak256 } from "ethers/lib/utils";
import { StatusCodes } from "http-status-codes";
import OperationError from "../errorhandlers/OperationError";
import ReferralModel from "../models/ReferralModel";
import WhitelistModel from "../models/WhitelistModel";
import Web3Signer from "../providers/Web3Signer";

export interface WhitelistReq {
  user: string;
}

export interface PurchaseApproval {
  nonce: string;
  sig: Signature;
}

class EggSaleService {
  public addWhitelist = async ({ user }: WhitelistReq): Promise<void> => {
    await WhitelistModel.create({ address: getAddress(user) });
  };

  public deleteWhitelist = async (user: string): Promise<void> => {
    await WhitelistModel.remove({ address: getAddress(user) });
  };

  public isWhitelisted = async (user: string, refId?: string): Promise<boolean> => {
    const query = await WhitelistModel.findOne({ address: getAddress(user) });
    if (query) {
      return true;
    }

    if (refId) {
      const query = await ReferralModel.findOne({ refId });
      if (query && query.referrer !== getAddress(user)) {
        return true;
      }
    }

    return false;
  };

  public getPurchaseApproval = async (user: string, refId?: string): Promise<PurchaseApproval> => {
    if (!(await this.isWhitelisted(user, refId))) {
      throw new OperationError(StatusCodes.NOT_ACCEPTABLE);
    }

    const nonce = hexlify(randomBytes(32));
    const messageHash = solidityKeccak256(["address", "bytes32"], [user, nonce]);
    const sig = await this.web3Signer.sign(messageHash);

    return {
      nonce,
      sig,
    };
  };

  private get web3Signer() {
    return new Web3Signer();
  }
}

export default EggSaleService;
