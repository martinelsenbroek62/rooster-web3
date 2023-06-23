import { Schema } from "mongoose";
import Database from "../providers/Database";

export interface Whitelist {
  address: string;
}

const whitelistSchema = new Schema<Whitelist>(
  {
    address: String,
  },
  { collection: "whitelist" },
);

const connection = Database.mongoConnection("egg");
const WhitelistModel = connection.model<Whitelist>("WhitelistModel", whitelistSchema);

export default WhitelistModel;
