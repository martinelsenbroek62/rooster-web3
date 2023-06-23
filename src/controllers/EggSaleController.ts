import {
  Controller,
  Get,
  Route,
  Tags,
  Post,
  SuccessResponse,
  Query,
  Body,
  Delete,
  Path,
  Security,
} from "tsoa";
import EggSaleService, { PurchaseApproval, WhitelistReq } from "../services/EggSaleService";
import ReferralService from "../services/ReferralService";
import {
  RefId,
  Click,
  RefTransaction,
  RefData,
  CreateRefReq,
  RecordClickReq,
  TrackReferralReq,
  LeaderBoardUser,
} from "../services/types";

@Route("egg/eggsale")
@Tags("EggSale")
export class EggSaleController extends Controller {
  /**
   * Adds user to whitelist (Requires admin token)
   */
  @SuccessResponse(200, "Added")
  @Security("bearer", ["admin"])
  @Post("/whitelist")
  public async addWhitelist(@Body() req: WhitelistReq): Promise<void> {
    return this.service.addWhitelist(req);
  }

  /**
   * Delete user from whitelist (Requires admin token)
   */
  @SuccessResponse(200, "Deleted")
  @Security("bearer", ["admin"])
  @Delete("/whitelist/{user}")
  public async deleteWhitelist(@Path() user: string): Promise<void> {
    return this.service.deleteWhitelist(user);
  }

  /**
   * Check if a user is whitelisted or not
   */
  @Security("apiKey")
  @Get("/whitelist")
  public async isWhitlisted(@Query() user: string, @Query() refId?: string): Promise<boolean> {
    return this.service.isWhitelisted(user, refId);
  }

  /**
   * Retrives purchase approval for private sale
   * @param user Address
   * @param refId Optional referral id
   * @returns nonce and signature struct
   */
  @Security("apiKey")
  @Get("/purchase-approval")
  public async getPurchaseApproval(
    @Query() user: string,
    @Query() refId?: string,
  ): Promise<PurchaseApproval> {
    return this.service.getPurchaseApproval(user, refId);
  }

  private get service() {
    return new EggSaleService();
  }
}

@Route("egg/eggsale/referral")
@Tags("Referral")
export class EggSaleReferalController extends Controller {
  /**
   * Registers referral account
   */
  @SuccessResponse(200, "Created")
  @Security("apiKey")
  @Post("/refId")
  public async createReferralId(@Body() req: CreateRefReq): Promise<RefId> {
    return this.service.createReferralId(req);
  }

  /**
   * Retrieves refId of a given user
   */
  @Security("apiKey")
  @Get("/refId")
  public async getReferralId(@Query() user: string): Promise<RefId> {
    return this.service.getReferralId(user);
  }

  /**
   * Validates refId.
   */
  @Security("apiKey")
  @Get("/refId/is-valid")
  public async validateReferralId(@Query() refId: string): Promise<boolean> {
    return this.service.isReferralIdValid(refId);
  }

  /**
   * Retrieves array of clicks of a given user
   */
  @Security("apiKey")
  @Get("/clicks")
  public async getClicks(@Query() user: string): Promise<Click[]> {
    return this.service.getClicks(user);
  }

  /**
   * Retrieves array of transactions of a given user
   */
  @Security("apiKey")
  @Get("/transactions")
  public async getTransactions(@Query() user: string): Promise<RefTransaction[]> {
    return this.service.getTransactions(user);
  }

  /**
   * Retrieves array of transactions of a given user
   */
  @Security("apiKey")
  @Get("/data")
  public async getReferralData(@Query() user: string): Promise<RefData[]> {
    return this.service.getReferralData(user);
  }

  /**
   * Retrieves array of transactions of a given user
   */
  @Security("apiKey")
  @Get("/leaderboard")
  public async getReferralLeaderBoard(): Promise<LeaderBoardUser[]> {
    return this.service.getReferralLeaderboard();
  }

  /**
   * Records click of a given referral id
   */
  @Security("apiKey")
  @SuccessResponse(200, "Success")
  @Post("/click")
  public async recordClick(@Body() req: RecordClickReq): Promise<void> {
    return this.service.recordClick(req);
  }

  /**
   * Tracks purchase of a given referral id and recipient
   */
  @Security("apiKey")
  @SuccessResponse(200, "Success")
  @Post("/track")
  public async trackReferral(@Body() req: TrackReferralReq): Promise<void> {
    return this.service.trackReferral(req);
  }

  private get service() {
    return new ReferralService();
  }
}
