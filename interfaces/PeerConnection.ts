import { AppendEntryRequest, AppendEntryResponse, RequestVoteRequest, RequestVoteResponse } from "@/dtos";

export interface PeerConnection {
    peerId: string,
    requestVote(request: RequestVoteRequest, callback : (response: RequestVoteResponse) => void): void;
    appendEntry(request: AppendEntryRequest, callback : (response: AppendEntryResponse) => void): void;
}