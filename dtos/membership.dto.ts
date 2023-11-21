export enum MEMBERSHIP_CHANGES_RESPONSES {
    'OK' = 'OK',
    'NOT_LEADER' = 'NOT_LEADER',
}

export interface AddServerRequest {
  newServer: string;
}

export interface AddServerResponse {
  status: MEMBERSHIP_CHANGES_RESPONSES;
  leaderHint: string;
}
