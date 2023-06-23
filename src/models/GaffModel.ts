import { Schema } from "mongoose";
import Database from "../providers/Database";

export interface Gaff {
  id: number;
  gaffType: number;
}

const gaffSchema = new Schema<Gaff>(
  {
    id: Number,
    gaffType: Number,
  },
  { collection: "gaff" },
);

const connection = Database.mongoConnection("nfts");
const GaffModel = connection.model<Gaff>("GaffModel", gaffSchema);

export default GaffModel;
