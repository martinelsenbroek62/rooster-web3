import axios from "axios";

class ScholarshipApi {
  baseUrl: string;
  apiKey: string;

  constructor() {
    this.baseUrl = process.env.SCHOLARSHIP_API || "";
    this.apiKey = process.env.SCHOLARSHIP_API_KEY || "";
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

export default ScholarshipApi;
