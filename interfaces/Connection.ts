import { RequestVoteRequest, RequestVoteResponse } from "@/dtos";

export interface PeerConnection {
    requestVote(request: RequestVoteRequest, callback : (...args: any[]) => void): RequestVoteResponse;
}