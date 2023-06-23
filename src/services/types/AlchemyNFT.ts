interface Contract {
  address: string;
}

interface TokenMetadata {
  tokenType: string;
}

interface Id {
  tokenId: string;
  tokenMetadata: TokenMetadata;
}

interface TokenUri {
  raw: string;
  gateway: string;
}

interface Medium {
  raw: string;
  gateway: string;
}

interface Attribute {
  value: string;
  trait_type: string;
}

interface Metadata {
  name: string;
  image: string;
  description: string;
  attributes: Attribute[];
  id: number;
  breed: number;
}

interface OwnedNft {
  contract: Contract;
  id: Id;
  balance: string;
  title: string;
  description: string;
  tokenUri: TokenUri;
  media: Medium[];
  metadata: Metadata;
  timeLastUpdated: Date;
}

export interface AlchemyNFT {
  ownedNfts: OwnedNft[];
  pageKey?: string;
  totalCount: number;
  blockHash: string;
}
