import { GraphQLClient } from "graphql-request";
import { getSdk } from "./graphql";

const client = new GraphQLClient(process.env.GRAPH_API || "");
export const sdk = getSdk(client);
