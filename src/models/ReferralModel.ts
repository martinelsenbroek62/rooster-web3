import { Schema } from "mongoose";
import Database from "../providers/Database";

export interface Referral {
  refId: string;
  referrer: string;
  recipient: string;
  amount: number;
  transactionHash: string;
  clickTimestamp: number;
}

const referralSchema = new Schema<Referral>(
  {
    refId: String,
    referrer: String,
    recipient: String,
    amount: Number,
    transactionHash: String,
    clickTimestamp: Number,
  },
  { collection: "referral" },
);

const connection = Database.mongoConnection("egg");
const ReferralModel = connection.model<Referral>("ReferralModel", referralSchema);

export default ReferralModel;
