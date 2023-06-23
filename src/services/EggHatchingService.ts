import { Signature } from "ethers";
import { solidityKeccak256 } from "ethers/lib/utils";
import EggModel from "../models/EggModel";
import Web3Signer from "../providers/Web3Signer";

export interface ParametersForEggHatch {
  breeds: number[];
  gaffTypes: number[];
  gemTypes: number[];
  sig: Signature;
}

class EggHatchingService {
  public getParametersForEggHatch = async (
    user: string,
    eggIds: number[],
  ): Promise<ParametersForEggHatch> => {
    const docs: { id: number; breed: number; gemType: number; gaffType: number }[] = [];
    const eggs = await EggModel.find({ id: { $in: eggIds }, breed: { $exists: true } });
    const types = eggIds.map((eggId) => {
      const egg = eggs.find((item) => item.id === eggId);
      if (egg) {
        return {
          breed: egg.breed,
          gaffType: egg.gaffType,
          gemType: egg.gemType,
        };
      } else {
        const types = this.generateTypes();
        docs.push({ id: eggId, ...types });
        return types;
      }
    });

    if (docs.length > 0) {
      await EggModel.insertMany(
        docs.map(({ id, breed, gemType, gaffType }) => ({
          id,
          breed,
          gemType,
          gaffType,
        })),
      );
    }

    const breeds = types.map((type) => type.breed);
    const gaffTypes = types.map((type) => type.gaffType);
    const gemTypes = types.map((type) => type.gemType);
    const hash = solidityKeccak256(
      ["address", "uint256[]", "uint256[]", "uint256[]"],
      [user, breeds, gaffTypes, gemTypes],
    );
    const sig = await this.web3Signer.sign(hash);

    return {
      breeds,
      gaffTypes,
      gemTypes,
      sig,
    };
  };

  private generateTypes = () => {
    const breed = this.getRandomNumberBetween(1, 10);
    const gaffType = this.getRandomGaffId();
    const gemType = this.getRandomNumberBetween(1, 29);
    return {
      breed,
      gaffType,
      gemType,
    };
  };

  private getRandomGaffId = () => {
    const rarity = [2100, 2100, 1750, 1050, 750, 750, 625, 375, 150, 150, 125, 75];
    const table = rarity.reduce<number[]>((prev, curr) => {
      return [...prev, curr + (prev[prev.length - 1] || 0)];
    }, []);
    const randomNumber = this.getRandomNumberBetween(0, 9999);
    const gaffId = table.findIndex((item) => item > randomNumber) + 1;
    return gaffId;
  };

  private getRandomNumberBetween = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  private get web3Signer() {
    return new Web3Signer();
  }
}

export default EggHatchingService;
