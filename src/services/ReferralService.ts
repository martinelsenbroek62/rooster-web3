import { TypedDataDomain } from "@ethersproject/abstract-signer";
import { base58, verifyTypedData } from "ethers/lib/utils";
import { StatusCodes } from "http-status-codes";
import OperationError from "../errorhandlers/OperationError";
import EggPurchaseModel from "../models/EggPurchaseModel";
import ReferralModel from "../models/ReferralModel";
import { web3 } from "../providers/Web3Provider";
import { getValidAddress } from "./utils/address";
import {
  RefId,
  Click,
  RefTransaction,
  RefData,
  CreateRefReq,
  RecordClickReq,
  TrackReferralReq,
  LeaderBoardUser,
} from "./types";
import { cache } from "../providers/Cache";

class ReferralService {
  public getReferralId = async (user: string): Promise<RefId> => {
    user = getValidAddress(user);
    const query = await ReferralModel.findOne({ referrer: user, refId: { $exists: true } });
    if (!query) {
      throw new OperationError(StatusCodes.NOT_FOUND);
    }
    return {
      refId: query.refId,
    };
  };

  public isReferralIdValid = async (refId: string): Promise<boolean> => {
    if (!refId.match(/^[0-9a-zA-Z]+$/) || refId.length < 3 || refId.length > 20) {
      return false;
    }
    const query = await ReferralModel.findOne({ refId });
    if (query) {
      return false;
    }
    return true;
  };

  public createReferralId = async ({ user, refId, sig }: CreateRefReq): Promise<RefId> => {
    user = getValidAddress(user);

    if (refId && sig) {
      if (!this.isReferralIdValid(refId)) {
        throw new OperationError(StatusCodes.NOT_ACCEPTABLE);
      }

      const types = {
        message: [
          { name: "user", type: "address" },
          { name: "refId", type: "string" },
        ],
      };
      const value = {
        user,
        refId,
      };
      const recoveredAddress = verifyTypedData(<TypedDataDomain>{}, types, value, sig);
      if (recoveredAddress !== user) {
        throw new OperationError(StatusCodes.NOT_ACCEPTABLE);
      }
    } else {
      refId = base58.encode(user).substring(0, 8);
    }

    const data = {
      refId,
      referrer: user,
    };
    await ReferralModel.updateOne(data, data, { upsert: true });
    return { refId };
  };

  public getClicks = async (user: string): Promise<Click[]> => {
    const { refId } = await this.getReferralId(user);
    const clicks = await ReferralModel.find(
      { refId, clickTimestamp: { $exists: true } },
      { clickTimestamp: 1, _id: 0 },
    );
    if (!clicks || clicks.length === 0) {
      return [];
    }
    return clicks;
  };

  public recordClick = async ({ refId }: RecordClickReq): Promise<void> => {
    const query = await ReferralModel.findOne({ refId });
    if (!query) {
      throw new OperationError(StatusCodes.NOT_FOUND);
    }
    const clickTimestamp = Math.floor(Date.now() / 1000);
    await ReferralModel.create({
      refId,
      clickTimestamp,
    });
  };

  public getTransactions = async (user: string): Promise<RefTransaction[]> => {
    user = getValidAddress(user);
    const { refId } = await this.getReferralId(user);
    const unverifiedTransactions = await ReferralModel.find(
      {
        refId,
        transactionHash: { $exists: true },
      },
      { _id: 0, transactionHash: 1 },
    );
    if (!unverifiedTransactions || unverifiedTransactions.length === 0) {
      return [];
    }
    const hashes = unverifiedTransactions.map((item) => item.transactionHash);
    const transactions = await EggPurchaseModel.find(
      {
        transactionHash: { $in: hashes },
        purchaser: { $ne: user },
      },
      { _id: 0, transactionHash: 1, purchaser: 1, amount: 1, timestamp: 1 },
    );
    return transactions;
  };

  public getReferralData = async (user: string): Promise<RefData[]> => {
    const transactions = await this.getTransactions(user);
    const clicksData = await this.getClicks(user);
    const clicks = clicksData.map((item) => ({ timestamp: item.clickTimestamp }));
    const data: RefData[] = [...transactions, ...clicks].sort((a, b) =>
      a.timestamp > b.timestamp ? 1 : -1,
    );
    return data;
  };

  public getReferralLeaderboard = async (): Promise<LeaderBoardUser[]> => {
    return cache.getAsync(
      "leaderboard",
      async () => {
        interface UT {
          address: string;
          refId: string;
          transactions: string[];
        }

        interface User {
          total: number;
          refId: string;
        }

        const unverifiedTransactions = await ReferralModel.aggregate<UT>([
          {
            $group: {
              _id: "$refId",
              address: { $addToSet: "$referrer" },
              transactions: { $addToSet: "$transactionHash" },
            },
          },
          {
            $match: {
              "transactions.4": { $exists: true },
            },
          },
          {
            $project: {
              _id: 0,
              refId: "$_id",
              address: { $arrayElemAt: ["$address", 0] },
              transactions: 1,
            },
          },
        ]);

        const users = await Promise.all<User>(
          unverifiedTransactions.map(async (item) => {
            return (
              await EggPurchaseModel.aggregate([
                {
                  $match: {
                    transactionHash: { $in: item.transactions },
                    purchaser: { $ne: item.address },
                  },
                },
                {
                  $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    total: 1,
                    refId: item.refId,
                  },
                },
              ])
            )[0];
          }),
        );
        return users.sort((a, b) => b.total - a.total);
      },
      60 * 30,
    );
  };

  public trackReferral = async ({ txHash, refId }: TrackReferralReq): Promise<void> => {
    const query = await Promise.all([
      ReferralModel.findOne({ refId }),
      ReferralModel.findOne({ transactionHash: txHash }),
    ]);
    if (!query[0] || query[1]) {
      throw new OperationError(StatusCodes.BAD_REQUEST);
    }
    const tx = await web3.provider.getTransaction(txHash);
    if (tx !== null && tx.blockNumber) {
      const { timestamp } = await web3.provider.getBlock(tx.blockNumber);
      const now = Date.now() / 1000;
      if (timestamp <= now - 30) {
        throw new OperationError(StatusCodes.BAD_REQUEST);
      }
    }
    await ReferralModel.create({ transactionHash: txHash, refId });
  };
}

export default ReferralService;
