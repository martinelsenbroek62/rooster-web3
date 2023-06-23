import { Schema } from "mongoose";
import Database from "../providers/Database";
import { Metadata } from "../services/types";

export interface Rooster extends Metadata {
  id: number;
  breed: number;
  printed: boolean;
}

const roosterSchema = new Schema<Rooster>(
  {
    id: Number,
    breed: Number,
    printed: Boolean,
    name: String,
    description: String,
    image: String,
    attributes: [
      {
        trait_type: String,
        value: String,
      },
    ],
  },
  { collection: "rooster" },
);

const connection = Database.mongoConnection("nfts");
const RoosterModel = connection.model<Rooster>("RoosterModel", roosterSchema);

export default RoosterModel;
