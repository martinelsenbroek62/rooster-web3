import OperationError from "../errorhandlers/OperationError";
import GameApi from "../providers/GameApi";
import { web3 } from "../providers/Web3Provider";
import { Attribute, Metadata } from "./types";
import { GaffType } from "./types/GaffType";
import { fromBN } from "./utils/bn";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import Database from "../providers/Database";
import { cache } from "../providers/Cache";

class GaffService {
  public getGaffMetadata = async (gaffId: number, req: Request): Promise<Metadata> => {
    const gaffTypeId = await this.getGaffTypeId(gaffId);
    const gaffType = await this.getGaffType(gaffTypeId);
    if (!gaffType) {
      throw new OperationError(StatusCodes.NOT_FOUND);
    }
    const metadata = this.createMetadata(gaffId, gaffType, req);
    return metadata;
  };

  public getGaffImageLink = async (gaffTypeId: number): Promise<string> => {
    const gaffType = await this.getGaffType(gaffTypeId);
    if (!gaffType) {
      throw new OperationError(StatusCodes.NOT_FOUND);
    }
    const imageLink = Database.containerLink("gameassets-container") + "/" + gaffType.name + ".png";
    return imageLink;
  };

  private getGaffTypeId = async (gaffId: number) => {
    return cache.getAsync(
      `gaffTypeId/${gaffId}`,
      async () => {
        try {
          return fromBN(await web3.gaff.gaffTypes(gaffId));
        } catch {
          return undefined;
        }
      },
      0,
    );
  };

  private getGaffType = async (gaffTypeId?: number) => {
    const { data: gaffTypes } = await this.gameApi.get<GaffType[]>("/Tokens/GaffTypes");
    const gaffType = gaffTypes.find((item) => item.gaffTypeId === gaffTypeId);
    return gaffType;
  };

  private createMetadata = (gaffId: number, gaffType: GaffType, req: Request) => {
    const attributes: Attribute[] = [
      { trait_type: "STARS", value: gaffType.stars, max_value: 3 },
      { trait_type: "RARITY", value: gaffType.rarity },
    ];
    const baseUrl = req.protocol + "://" + req.get("host");
    const metadata = {
      id: gaffId,
      gaffType: gaffType.gaffTypeId,
      name: gaffType.name,
      image: `${baseUrl}/gaff/image/${gaffType.gaffTypeId}`,
      description: gaffType.description || "",
      attributes,
    };
    return metadata;
  };

  private get gameApi() {
    const { instance } = new GameApi();
    return instance;
  }
}

export default GaffService;
