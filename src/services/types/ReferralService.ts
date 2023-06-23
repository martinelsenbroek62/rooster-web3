export interface RefId {
  refId: string;
}

export interface Click {
  clickTimestamp: number;
}

export interface RefTransaction {
  transactionHash: string;
  purchaser: string;
  amount: number;
  timestamp: number;
}

export interface RefData {
  transactionHash?: string;
  purchaser?: string;
  amount?: number;
  timestamp: number;
}

export interface CreateRefReq {
  user: string;
  refId?: string;
  sig?: string;
}

export interface RecordClickReq {
  refId: string;
}

export interface TrackReferralReq {
  refId: string;
  txHash: string;
}

export interface LeaderBoardUser {
  total: number;
  refId: string;
}
