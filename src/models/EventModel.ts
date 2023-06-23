import { Schema } from "mongoose";
import Database from "../providers/Database";

export interface Event {
  address: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  logIndex: number;
  event: string;
  args: string;
}

const eventSchema = new Schema<Event>(
  {
    address: String,
    transactionHash: String,
    blockNumber: Number,
    timestamp: Number,
    logIndex: Number,
    event: String,
    args: String,
  },
  { collection: "events" },
);

const connection = Database.mongoConnection("event");
const EventModel = connection.model<Event>("EventModel", eventSchema);

export default EventModel;
