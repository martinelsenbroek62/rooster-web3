import { BigNumber } from "ethers";
import { isAddress, keccak256, sha256 } from "ethers/lib/utils";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import OperationError from "../errorhandlers/OperationError";
import RoosterModel from "../models/RoosterModel";
import GameApi from "../providers/GameApi";
import ScholarshipApi from "../providers/ScholarshipApi";
import {
  Background,
  Breed,
  AlchemyNFT,
  RoosterMetadata,
  Border,
  Attribute,
  OwnedRooster,
  ScholarshipNFT,
  RoosterOwnershipState,
  OwnedRoosterFilter,
  RoosterIdWithState,
} from "./types";
import { fromBN, fromBNArray, toBN } from "./utils/bn";
import { Contract } from "ethcall";
import RoosterAbi from "../providers/contracts/abis/Rooster.json";
import Database from "../providers/Database";
import { cache } from "../providers/Cache";
import { web3 } from "../providers/Web3Provider";

class RoosterService {
  public getRoosterMetadata = async (roosterId: number, req: Request): Promise<RoosterMetadata> => {
    const [breedId, { background, border }] = await Promise.all([
      this.getAndSyncBreedId(roosterId),
      this.getBackgroundAndBorder(roosterId),
    ]);
    const breed = await this.getBreed(breedId);
    if (!breed || !background || !border) {
      throw new OperationError(StatusCodes.NOT_FOUND);
    }
    return this.createMetadata(roosterId, breed, background, border, req);
  };

  public getRoosterImageLink = async (roosterId: number): Promise<string> => {
    const { backgroundId, borderId } = this.getBackgroundAndBorderIds(roosterId);
    const breedId = await this.getAndSyncBreedId(roosterId);
    if (!breedId) {
      throw new OperationError(StatusCodes.NOT_FOUND);
    }
    const imageName = this.getImageName(breedId, backgroundId, borderId);
    return Database.containerLink("rooster") + "/" + imageName;
  };

  public hasRooster = async (user: string): Promise<boolean> => {
    if (!isAddress(user)) {
      throw new OperationError(StatusCodes.NOT_ACCEPTABLE);
    }
    return (await this.getRoosterBalance(user)) > 0 ? true : false;
  };

  public ownedRoosters = async (
    user: string,
    withMetadata: boolean,
    limit: number,
    page: number,
    filter: OwnedRoosterFilter,
    req: Request,
  ) => {
    if (!isAddress(user)) {
      throw new OperationError(StatusCodes.NOT_ACCEPTABLE);
    }
    if (limit < 1 || limit > 100) {
      throw new OperationError(StatusCodes.NOT_ACCEPTABLE);
    }

    const roosterIdsWithState: RoosterIdWithState[] = [];

    // Get add rooster ids
    if (filter.owned === true) {
      roosterIdsWithState.push(...(await this.getOwnedRoostersFromAlchemy(user, limit, page)));
    }
    if ((filter.leased === true || filter.renting === true) && roosterIdsWithState.length === 0) {
      roosterIdsWithState.push(
        ...(await this.getOwnedRoostersFromScholarship(user, limit, page, filter)),
      );
    }

    // Return [] if balance is 0
    if (roosterIdsWithState.length == 0) {
      return [];
    }

    // Get breed and printed states
    const roosterIds = roosterIdsWithState.map((i) => i.id);
    const breedIdsAndPrintedStates = await this.getAndSyncBreedIds(roosterIds);

    if (withMetadata) {
      const [backgroundAndBorders, breeds] = await Promise.all([
        this.getBackgroundAndBorders(roosterIds),
        this.getBreeds(breedIdsAndPrintedStates.map((i) => i.breedId)),
      ]);
      return roosterIds.map((roosterId, index) => {
        const breed = breeds[index];
        const { background, border } = backgroundAndBorders[index];
        if (!breed || !background || !border) {
          throw new OperationError(StatusCodes.NOT_FOUND);
        }
        return {
          ...this.createMetadata(roosterId, breed, background, border, req),
          state: roosterIdsWithState[index].state,
          address: web3.rooster.address,
          blockchain: process.env.BLOCKCHAIN || "Polygon",
        };
      });
    } else {
      return roosterIdsWithState.map<OwnedRooster>(({ id, state }, index) => ({
        id,
        breed: breedIdsAndPrintedStates[index].breedId,
        state,
        address: web3.rooster.address,
        blockchain: process.env.BLOCKCHAIN || "Polygon",
      }));
    }
  };

  public getRoostwerOwnershipState = async (
    roosterId: number,
    user: string,
  ): Promise<RoosterOwnershipState> => {
    if (!isAddress(user)) {
      throw new OperationError(StatusCodes.NOT_ACCEPTABLE);
    }
    return cache.getAsync(`roosterOwnershipState/${roosterId}/${user}`, async () => {
      const [owner, { data: scholarRes }] = await Promise.all([
        web3.rooster.ownerOf(roosterId),
        this.scholarshipApi.get<ScholarshipNFT | null>(
          `/scholarship/info/${"0x" + roosterId.toString(16)}`,
        ),
      ]);

      if (owner.toLowerCase() === user && scholarRes === null) {
        return "owned";
      }
      if (scholarRes?.owner === user) {
        return "leased";
      }
      if (scholarRes?.scholar === user) {
        return "renting";
      }
      return "notOwned";
    });
  };

  private getRoosterBalance = async (user: string) => {
    return cache.getAsync(`roosterBalance/${user}`, async () => {
      const balance = await web3.rooster.balanceOf(user);
      return balance.toNumber();
    });
  };

  private getOwnedRoostersFromAlchemy = async (user: string, limit: number, page: number) => {
    const roosters: RoosterIdWithState[] = [];
    const left = Math.floor((limit * page) / 100);
    const right = Math.ceil((limit * (page + 1)) / 100);

    for (let i = left; i < right; i++) {
      const pageKey = await cache.get<string>(`alchemyRoosterPageKey/${user}/${i}`);

      if (pageKey === null && i > 0) {
        i -= 2;
        continue;
      }

      const { data } = await web3.api.get<AlchemyNFT>("/getNFTs", {
        params: {
          owner: user,
          contractAddresses: [web3.rooster.address],
          withMetadata: false,
          ...(pageKey && { pageKey }),
        },
      });

      if (i >= left && i < right) {
        roosters.push(
          ...data.ownedNfts.map<RoosterIdWithState>(({ id }) => ({
            id: Number(id.tokenId),
            state: "owned",
          })),
        );
      }

      if (!data.pageKey) {
        break;
      }

      await cache.set(`alchemyRoosterPageKey/${user}/${i + 1}`, data.pageKey, 60 * 5);
    }

    return roosters.slice((limit * page) % 100, ((limit * page) % 100) + limit);
  };

  private getOwnedRoostersFromScholarship = async (
    user: string,
    limit: number,
    page: number,
    filter: OwnedRoosterFilter,
  ) => {
    const alchemyLastPage = filter.owned
      ? Math.floor((await this.getRoosterBalance(user)) / limit) + 1
      : 0;
    const { data } = await this.scholarshipApi.get<ScholarshipNFT[]>("/scholarship", {
      params: {
        ...(filter.leased && { owner: user.toLowerCase() }),
        ...(filter.renting && { scholar: user.toLowerCase() }),
        revoked: false,
        nPerPage: limit,
        pageNumber: page - alchemyLastPage + 1,
        _or: filter.leased && filter.renting ? true : false,
        decimal_nft_id: true,
      },
    });
    return data.map<RoosterIdWithState>(({ nft_id, owner, scholar }) => ({
      id: nft_id,
      state: owner === scholar ? "owned" : user.toLowerCase() === owner ? "leased" : "renting",
    }));
  };

  private getAndSyncBreedId = async (roosterId: number) => {
    return await cache.getAsync(
      `breedId/${roosterId}`,
      async () => {
        try {
          const breedId = fromBN(await web3.rooster.breeds(roosterId));
          await RoosterModel.create({ id: roosterId, breed: breedId });
          return breedId;
        } catch {
          return undefined;
        }
      },
      0,
    );
  };

  private getAndSyncBreedIds = async (roosterIds: number[]) => {
    const roosters = await RoosterModel.aggregate<{
      id: number;
      breedId: number;
    }>([
      {
        $match: { id: { $in: roosterIds } },
      },
      {
        $group: {
          _id: "$id",
          breed: { $addToSet: "$breed" },
        },
      },
      {
        $project: {
          id: "$_id",
          breed: { $arrayElemAt: ["$breed", 0] },
        },
      },
      {
        $addFields: { __order: { $indexOfArray: [roosterIds, "$id"] } },
      },
      {
        $sort: { __order: 1 },
      },
      {
        $project: {
          _id: 0,
          id: 1,
          breedId: "$breed",
        },
      },
    ]);

    if (roosterIds.length !== roosters.length) {
      const unrecordedRoostersIds = roosterIds.filter((i) => !roosters.find((j) => i === j.id));
      const multicallProvider = await web3.multicallProvider();
      const roosterContract = new Contract(web3.rooster.address, RoosterAbi.abi);

      /* eslint-disable */
      const breedIds = fromBNArray(
        await multicallProvider.all(unrecordedRoostersIds.map((id) => roosterContract.breeds(id))),
      );
      /* eslint-enable */

      await RoosterModel.insertMany(
        unrecordedRoostersIds.map((id, index) => ({
          id,
          breed: breedIds[index],
        })),
      );

      return [
        ...roosters,
        ...unrecordedRoostersIds.map((id, index) => ({
          id,
          breedId: breedIds[index],
        })),
      ];
    }

    return roosters;
  };

  private getBackgroundAndBorder = async (roosterId: number) => {
    return (await this.getBackgroundAndBorders([roosterId]))[0];
  };

  private getBackgroundAndBorders = async (roosterIds: number[]) => {
    const [{ data: backgrounds }, { data: borders }] = await Promise.all([
      this.gameApi.get<Background[]>("/Images/Background"),
      this.gameApi.get<Border[]>("/Images/Border"),
    ]);
    return roosterIds.map((roosterId) => {
      const { backgroundId, borderId } = this.getBackgroundAndBorderIds(roosterId);
      return {
        background: backgrounds.find((item) => item.mannochBackgroundId === backgroundId),
        border: borders.find((item) => item.mannochBorderId === borderId),
      };
    });
  };

  private getBackgroundAndBorderIds = (roosterId: number) => {
    const backgroundId = Number(toBN(keccak256(toBN(roosterId).toHexString())).mod(10)) + 1;
    const borderId = Number(toBN(sha256(toBN(roosterId).toHexString())).mod(10)) + 1;
    return { backgroundId, borderId };
  };

  private getBreed = async (breedId?: number) => {
    return typeof breedId === "number" ? (await this.getBreeds([breedId]))[0] : undefined;
  };

  private getBreeds = async (breedIds: number[]) => {
    const { data: breeds } = await this.gameApi.get<Breed[]>("/Bodyparts/Breeds");
    return breedIds.map((breedId) => breeds.find((item) => item.breedId === breedId));
  };

  private createMetadata = (
    roosterId: number,
    breed: Breed,
    background: Background,
    border: Border,
    req: Request,
  ) => {
    const attributes: Attribute[] = [];
    attributes.push(
      ...this.statNames.map<Attribute>((statName) => ({
        trait_type: statName.toUpperCase(),
        value: Number(breed[statName]),
      })),
    );
    attributes.push(
      ...this.partNames.map<Attribute>((partName) => ({
        trait_type: partName.toUpperCase(),
        value: breed[partName].name,
      })),
    );
    attributes.push({
      trait_type: "BACKGROUND",
      value: background.name,
    });
    attributes.push({
      trait_type: "BORDER",
      value: border.name,
    });
    attributes.push({
      trait_type: "FOCUS_METER",
      value: breed.focusMeter,
    });

    const baseUrl = req.protocol + "://" + req.get("host");
    const metadata = {
      id: roosterId,
      breed: breed.breedId,
      name: breed.name,
      image: `${baseUrl}/rooster/image/${roosterId}`,
      description: breed.description,
      attributes,
    };
    return metadata;
  };

  private getImageName = (breedId: number, backgroundId: number, borderId: number) => {
    const imageId = keccak256(
      BigNumber.from(
        breedId.toString() + backgroundId.toString() + borderId.toString(),
      ).toHexString(),
    ).slice(4, 13);
    const imageName = "r" + imageId + ".png";
    return imageName;
  };

  private get partNames() {
    return ["leg", "body", "crown", "head", "tail", "wing"] as const;
  }

  private get statNames() {
    return ["vit", "watk", "batk", "catk", "spd", "agro"] as const;
  }

  private get gameApi() {
    const { instance } = new GameApi();
    return instance;
  }

  private get scholarshipApi() {
    const { instance } = new ScholarshipApi();
    return instance;
  }
}

export default RoosterService;
