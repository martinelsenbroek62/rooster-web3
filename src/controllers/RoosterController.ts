import { Request as ExpressRequest, Response as ExpressResponse } from "express";
import { Controller, Get, Path, Query, Request, Route, SuccessResponse, Tags } from "tsoa";
import RoosterService from "../services/RoosterService";
import { RoosterMetadata, OwnedRooster } from "../services/types";

@Route("rooster")
@Tags("Rooster")
export class RoosterController extends Controller {
  @Get("/metadata/{tokenId}")
  public async getRoosterMetadata(
    @Path() tokenId: number,
    @Request() req: ExpressRequest,
  ): Promise<RoosterMetadata> {
    return this.service.getRoosterMetadata(tokenId, req);
  }

  @Get("/image/{tokenId}")
  @SuccessResponse(301, "Redirect")
  public async getRoosterImage(@Path() tokenId: number, @Request() req: ExpressRequest) {
    const res = req.res as ExpressResponse;
    const imageLink = await this.service.getRoosterImageLink(tokenId);
    res.redirect(imageLink);
    return null;
  }

  @Get("/owned-roosters")
  public async getOwnedRoosters(
    @Request() req: ExpressRequest,
    @Query() user: string,
    @Query() withMetadata = true,
    @Query() limit = 10,
    @Query() page = 0,
    @Query() owned = true,
    @Query() leased = true,
    @Query() renting = true,
  ): Promise<OwnedRooster[]> {
    return this.service.ownedRoosters(
      user,
      withMetadata,
      limit,
      page,
      { owned, leased, renting },
      req,
    );
  }

  @Get("/ownership-state")
  public async getRoosterOwnershipState(@Query() roosterId: number, @Query() user: string) {
    return this.service.getRoostwerOwnershipState(roosterId, user.toLowerCase());
  }

  @Get("/has-rooster")
  public async hasRooster(@Query() user: string): Promise<boolean> {
    return this.service.hasRooster(user.toLowerCase());
  }

  private get service() {
    return new RoosterService();
  }
}
