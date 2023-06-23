import { Controller, Get, Path, Query, Route, Security, Tags } from "tsoa";
import { Metadata } from "../services/types/Metadata";
import EggService from "../services/EggService";
import EggHatchingService, { ParametersForEggHatch } from "../services/EggHatchingService";

@Route("egg")
@Tags("Egg")
export class EggController extends Controller {
  @Get("/metadata/{tokenId}")
  public async getEggMetadata(@Path() tokenId: number): Promise<Metadata> {
    return this.service.getEggMetadata(tokenId);
  }

  @Get("/has-egg")
  public async hasEgg(@Query() user: string): Promise<boolean> {
    return this.service.hasEgg(user);
  }

  @Get("/ownedEggIds")
  public async ownedEggIds(@Query() user: string, @Query() limit = 10, @Query() page = 0) {
    return this.service.ownedEggIds(user, limit, page);
  }

  private get service() {
    return new EggService();
  }
}

@Route("egg/hatching")
@Tags("Egg")
export class EggHatchingController extends Controller {
  @Security("apiKey")
  @Get("/parameters")
  public async getParametersForEggHatch(
    @Query() user: string,
    @Query() eggIds: number[],
  ): Promise<ParametersForEggHatch> {
    return this.service.getParametersForEggHatch(user, eggIds);
  }

  private get service() {
    return new EggHatchingService();
  }
}
