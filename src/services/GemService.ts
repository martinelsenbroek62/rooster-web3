import OperationError from "../errorhandlers/OperationError";
import GameApi from "../providers/GameApi";
import { web3 } from "../providers/Web3Provider";
import { Attribute, Metadata } from "./types";
import { GemType } from "./types/GemType";
import { fromBN } from "./utils/bn";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import Database from "../providers/Database";
import { cache } from "../providers/Cache";

class GemService {
  public getGemMetadata = async (gemId: number, req: Request): Promise<Metadata> => {
    const gemTypeId = await this.getGemTypeId(gemId);
    const gemType = await this.getGemType(gemTypeId);
    if (!gemType) {
      throw new OperationError(StatusCodes.NOT_FOUND);
    }
    const metadata = this.createMetadata(gemId, gemType, req);
    return metadata;
  };

  public getGemImageLink = async (gemTypeId: number): Promise<string> => {
    const gemType = await this.getGemType(gemTypeId);
    if (!gemType) {
      throw new OperationError(StatusCodes.NOT_FOUND);
    }
    const imageLink = Database.containerLink("gameassets-container") + "/" + gemType.name + ".png";
    return imageLink;
  };

  private getGemTypeId = async (gemId: number) => {
    return cache.getAsync(
      `gemTypeId/${gemId}`,
      async () => {
        try {
          return fromBN(await web3.gem.gemTypes(gemId));
        } catch {
          return undefined;
        }
      },
      0,
    );
  };

  private getGemType = async (gemTypeId?: number) => {
    const { data: gemTypes } = await this.gameApi.get<GemType[]>("/Tokens/GemTypes");
    const gemType = gemTypes.find((item) => item.gemTypeId === gemTypeId);
    return gemType;
  };

  private createMetadata = (gemId: number, gemType: GemType, req: Request) => {
    const attributes: Attribute[] = [];
    const baseUrl = req.protocol + "://" + req.get("host");
    const metadata = {
      id: gemId,
      gemType: gemType.gemTypeId,
      name: gemType.name,
      image: `${baseUrl}/gem/image/${gemType.gemTypeId}`,
      description: gemType.description || "",
      attributes,
    };
    return metadata;
  };

  private get gameApi() {
    const { instance } = new GameApi();
    return instance;
  }
}

export default GemService;
