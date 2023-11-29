export enum MEMBERSHIP_CHANGES_RESPONSES {
    'OK' = 0,
    'NOT_LEADER' = 1,
}

export interface AddServerRequest {
  newServer: string;
}

export interface RemoveServerRequest {
  oldServer: string;
}

export interface MembershipChangeResponse {
  status: MEMBERSHIP_CHANGES_RESPONSES;
  leaderHint: string;
}
