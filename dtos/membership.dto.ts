export enum MEMBERSHIP_CHANGES_RESPONSES {
    'OK' = 'OK',
    'NOT_LEADER' = 'NOT_LEADER',
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
