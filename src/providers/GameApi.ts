import axios from "axios";

class GameApi {
  baseUrl: string;
  apiKey: string;

  constructor() {
    this.baseUrl = process.env.GAME_API || "";
    this.apiKey = process.env.GAME_API_KEY || "";
  }

  public get instance() {
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        XApiKey: this.apiKey,
      },
    });
  }
}

export default GameApi;
