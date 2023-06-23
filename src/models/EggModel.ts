import { Schema } from "mongoose";
import Database from "../providers/Database";

export interface Egg {
  id: number;
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string;
  }[];
  breed: number;
  gaffType: number;
  gemType: number;
}

const eggSchema = new Schema<Egg>(
  {
    id: Number,
    name: String,
    description: String,
    image: String,
    attributes: [
      {
        trait_type: String,
        value: String,
      },
    ],
    breed: Number,
    gaffType: Number,
    gemType: Number,
  },
  { collection: "metadata" },
);

const connection = Database.mongoConnection("egg");
const EggModel = connection.model<Egg>("EggModel", eggSchema);

export default EggModel;
