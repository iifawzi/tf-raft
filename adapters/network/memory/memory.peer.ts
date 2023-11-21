import {
  RequestVoteRequest,
  RequestVoteResponse,
  AppendEntryRequest,
  AppendEntryResponse,
} from "@/dtos";
import { PeerConnection } from "@/interfaces";
import { MemoryNetwork } from "./memory.network";

export class MemoryPeer implements PeerConnection {
  private network = MemoryNetwork.getNetwork();
  constructor(public peerId: string) {
    this.peerId = peerId;
  }

  public async requestVote(
    request: RequestVoteRequest,
    callback: (response: RequestVoteResponse) => void
  ): Promise<void> {
    const response = await this.network.requestVoteFromNode(
      this.peerId,
      request
    );
    callback(response);
  }

  public async appendEntries(
    request: AppendEntryRequest,
    callback: (response: AppendEntryResponse) => void
  ): Promise<void> {
    const response = await this.network.appendEntriesToNode(
      this.peerId,
      request
    );
    callback(response);
  }
}
