import { isAddress } from "ethers/lib/utils";
import { StatusCodes } from "http-status-codes";
import OperationError from "../errorhandlers/OperationError";
import EggModel from "../models/EggModel";
import { cache } from "../providers/Cache";
import { web3 } from "../providers/Web3Provider";
import { AlchemyNFT, Metadata } from "./types";
import { fromBN } from "./utils/bn";

class EggService {
  public getEggMetadata = async (id: number): Promise<Metadata> => {
    const latestEggId = await this.getLatestEggId();
    if (id > latestEggId) {
      throw new OperationError(StatusCodes.NOT_FOUND);
    }

    const metadata = await EggModel.findOne(
      { id, name: { $exists: true } },
      { _id: 0, id: 1, tokenId: 1, name: 1, description: 1, image: 1, attributes: 1 },
    );
    if (metadata) {
      return metadata;
    } else {
      throw new OperationError(StatusCodes.NOT_FOUND);
    }
  };

  public hasEgg = async (user: string): Promise<boolean> => {
    if (!isAddress(user)) {
      throw new OperationError(StatusCodes.NOT_ACCEPTABLE);
    }

    return cache.getAsync(
      `has-egg/${user}`,
      async () => {
        const balance = await web3.egg.balanceOf(user);
        return balance.gt(0) ? true : false;
      },
      60 * 10,
    );
  };

  public ownedEggIds = async (user: string, limit: number, page: number) => {
    if (!isAddress(user)) {
      throw new OperationError(StatusCodes.NOT_ACCEPTABLE);
    }
    if (limit < 1 || limit > 100) {
      throw new OperationError(StatusCodes.NOT_ACCEPTABLE);
    }

    const eggs: number[] = [];

    const left = Math.floor((limit * page) / 100);
    const right = Math.ceil((limit * (page + 1)) / 100);

    for (let i = left; i < right; i++) {
      const pageKey = await cache.get<string>(`alchemyEggPageKey/${user}/${i}`);

      if (pageKey === null && i > 0) {
        i -= 2;
        continue;
      }

      const { data } = await web3.api.get<AlchemyNFT>("/getNFTs", {
        params: {
          owner: user,
          contractAddresses: [web3.egg.address],
          withMetadata: false,
          ...(pageKey && { pageKey }),
        },
      });

      if (i >= left && i < right) {
        eggs.push(...data.ownedNfts.map(({ id }) => Number(id.tokenId)));
      }

      if (!data.pageKey) {
        break;
      }

      await cache.set(`alchemyEggPageKey/${user}/${i + 1}`, data.pageKey, 60 * 5);
    }

    return eggs.slice((limit * page) % 100, ((limit * page) % 100) + limit);
  };

  private getLatestEggId = async (): Promise<number> => {
    return cache.getAsync("currentEggId", async () => {
      return fromBN(await web3.eggsale.minted());
    });
  };
}

export default EggService;
