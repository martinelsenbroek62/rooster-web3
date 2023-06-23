export interface Part {
  name: string;
  description: string;
  imageUrl: string;
}

export type Gender = "M" | "F";

export interface Breed {
  breedId: number;
  name: string;
  description: string;
  vit: number;
  watk: number;
  batk: number;
  catk: number;
  spd: number;
  agro: number;
  focusMeter: string;
  gender: Gender;
  body: Part;
  crown: Part;
  head: Part;
  leg: Part;
  tail: Part;
  wing: Part;
}
