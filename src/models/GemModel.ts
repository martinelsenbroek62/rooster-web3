import { Schema } from "mongoose";
import Database from "../providers/Database";

export interface Gem {
  id: number;
  gemType: number;
}

const gemSchema = new Schema<Gem>(
  {
    id: Number,
    gemType: Number,
  },
  { collection: "gem" },
);

const connection = Database.mongoConnection("nfts");
const GemModel = connection.model<Gem>("GemModel", gemSchema);

export default GemModel;
