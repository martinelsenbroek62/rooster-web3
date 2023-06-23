import { Request as ExpressRequest, Response as ExpressResponse } from "express";
import { Controller, Get, Path, Request, Route, SuccessResponse, Tags } from "tsoa";
import GaffService from "../services/GaffService";
import { Metadata } from "../services/types";

@Route("gaff")
@Tags("Gaff")
export class GaffController extends Controller {
  @Get("/metadata/{tokenId}")
  public async getGaffMetadata(
    @Path() tokenId: number,
    @Request() req: ExpressRequest,
  ): Promise<Metadata> {
    return this.service.getGaffMetadata(tokenId, req);
  }

  @Get("/image/{gaffTypeId}")
  @SuccessResponse(301, "Redirect")
  public async getGaffImage(@Path() gaffTypeId: number, @Request() req: ExpressRequest) {
    const res = req.res as ExpressResponse;
    const imageLink = await this.service.getGaffImageLink(gaffTypeId);
    res.redirect(imageLink);
    return null;
  }

  private get service() {
    return new GaffService();
  }
}
