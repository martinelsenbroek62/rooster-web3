import { Wallet } from "ethers";
import { arrayify, splitSignature } from "ethers/lib/utils";
import Web3Provider from "./Web3Provider";

class Web3Signer extends Web3Provider {
  signer: Wallet;

  constructor() {
    super();
    const privateKey = process.env.SIGNER_PRIVATE_KEY || "";
    this.signer = new Wallet(privateKey, this.provider);
  }

  public sign = async (digest: string) => {
    const rawsig = await this.signer.signMessage(arrayify(digest));
    const sig = splitSignature(rawsig);
    return sig;
  };
}

export default Web3Signer;
