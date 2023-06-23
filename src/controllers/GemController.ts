import { Request as ExpressRequest, Response as ExpressResponse } from "express";
import { Controller, Get, Path, Request, Route, SuccessResponse, Tags } from "tsoa";
import GemService from "../services/GemService";
import { Metadata } from "../services/types";

@Route("gem")
@Tags("Gem")
export class GemController extends Controller {
  @Get("/metadata/{tokenId}")
  public async getGemMetadata(
    @Path() tokenId: number,
    @Request() req: ExpressRequest,
  ): Promise<Metadata> {
    return this.service.getGemMetadata(tokenId, req);
  }

  @Get("/image/{gemTypeId}")
  @SuccessResponse(301, "Redirect")
  public async getGemImage(@Path() gemTypeId: number, @Request() req: ExpressRequest) {
    const res = req.res as ExpressResponse;
    const imageLink = await this.service.getGemImageLink(gemTypeId);
    res.redirect(imageLink);
    return null;
  }

  private get service() {
    return new GemService();
  }
}
