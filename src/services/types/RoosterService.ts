import { Attribute } from "./Metadata";

export interface OwnedRooster {
  id: number;
  name?: string;
  image?: string;
  breed?: number;
  attributes?: Attribute[];
  state: "owned" | "leased" | "renting";
  address: string;
  blockchain: string;
}

export interface OwnedRoosterFilter {
  owned: boolean;
  leased: boolean;
  renting: boolean;
}

export interface RoosterIdWithState {
  id: number;
  state: OwnedRooster["state"];
}

export type RoosterOwnershipState = "owned" | "leased" | "renting" | "notOwned";
