import axios from "axios";
import { providers } from "ethers";
import {
  Gaff__factory,
  Gem__factory,
  RoosterEggSale__factory,
  RoosterEgg__factory,
  Rooster__factory,
} from "./contracts";
import { Provider as MultiCallProvider } from "ethcall";

export type AnyProvider = providers.JsonRpcProvider | providers.WebSocketProvider;

class Web3Provider {
  provider: AnyProvider;

  constructor() {
    const wsUrl = process.env.WS_URL;
    const rpcUrl = process.env.RPC_URL || "";

    this.provider = wsUrl
      ? new providers.WebSocketProvider(wsUrl)
      : new providers.JsonRpcProvider(rpcUrl);
  }

  public get api() {
    return axios.create({
      baseURL: this.provider.connection.url,
    });
  }

  public multicallProvider = async () => {
    const multicallProvider = new MultiCallProvider();
    await multicallProvider.init(this.provider);
    return multicallProvider;
  };

  public get egg() {
    const address = process.env.EGG_CONTRACT_ADDR || "";
    return RoosterEgg__factory.connect(address, this.provider);
  }

  public get eggsale() {
    const address = process.env.EGGSALE_CONTRACT_ADDR || "";
    return RoosterEggSale__factory.connect(address, this.provider);
  }

  public get rooster() {
    const address = process.env.ROOSTER_CONTRACT_ADDR || "";
    return Rooster__factory.connect(address, this.provider);
  }

  public get gaff() {
    const address = process.env.GAFF_CONTRACT_ADDR || "";
    return Gaff__factory.connect(address, this.provider);
  }

  public get gem() {
    const address = process.env.GEM_CONTRACT_ADDR || "";
    return Gem__factory.connect(address, this.provider);
  }
}

export const web3 = new Web3Provider();
export default Web3Provider;
