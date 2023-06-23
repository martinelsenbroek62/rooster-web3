import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import mongoose from "mongoose";

class Database {
  public static mongoConnection(dbname: string) {
    const db = new Database();
    const uri = db.getMongoUri(dbname);
    const auth = db.mongoAuth;
    const connection = mongoose.createConnection(uri, auth);
    return connection;
  }

  public static containerClient(containerName: string): ContainerClient {
    const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      AZURE_STORAGE_CONNECTION_STRING,
    );
    const containerClient = blobServiceClient.getContainerClient(containerName);
    return containerClient;
  }

  public static containerLink(containerName: string): string {
    const baseCDNUrl = process.env.AZURE_STORAGE_CDN_BASE_URL || "";
    if (baseCDNUrl) {
      return baseCDNUrl + "/" + containerName;
    } else {
      const contrainerClient = Database.containerClient(containerName);
      return contrainerClient.url;
    }
  }

  private getMongoUri(dbname: string) {
    const mongoUrl =
      process.env.DB_LOCALHOST === "true"
        ? process.env.MONGO_URL + "/" + dbname || ""
        : "mongodb://" +
          process.env.COSMOSDB_HOST +
          ":" +
          process.env.COSMOSDB_PORT +
          "/" +
          dbname +
          "?ssl=true&replicaSet=globaldb&retrywrites=false";
    return mongoUrl;
  }

  private get mongoAuth() {
    const mongoAuth =
      process.env.DB_LOCALHOST === "true"
        ? undefined
        : {
            auth: {
              username: process.env.COSMOSDB_USER,
              password: process.env.COSMOSDB_PASSWORD,
            },
          };
    return mongoAuth;
  }
}

export default Database;
