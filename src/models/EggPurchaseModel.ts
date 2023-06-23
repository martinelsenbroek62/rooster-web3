import { Schema } from "mongoose";
import Database from "../providers/Database";

export interface EggPurchase {
  purchaser: string;
  amount: number;
  value: string;
  transactionHash: string;
  timestamp: number;
}

const eggPurchaseSchema = new Schema<EggPurchase>(
  {
    purchaser: String,
    amount: Number,
    value: String,
    transactionHash: String,
    timestamp: Number,
  },
  { collection: "egg-purchase" },
);

const connection = Database.mongoConnection("event");
const EggPurchaseModel = connection.model<EggPurchase>("EggPurchaseModel", eggPurchaseSchema);

export default EggPurchaseModel;
