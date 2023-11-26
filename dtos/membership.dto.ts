export enum MEMBERSHIP_CHANGES_RESPONSES {
    'OK' = 1,
    'NOT_LEADER' = 2,
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
