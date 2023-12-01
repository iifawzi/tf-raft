import {
  RequestVoteRequest,
  RequestVoteResponse,
  AppendEntryRequest,
  AppendEntryResponse,
  AddServerRequest,
  MembershipChangeResponse,
  RemoveServerRequest,
  ClientQueryResponse,
  ClientRequestResponse,
} from "@/dtos";
import { Command, PeerConnection } from "@/interfaces";
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

  // used by clients / admins
  public async addServer(
    request: AddServerRequest
  ): Promise<MembershipChangeResponse> {
    const response = await this.network.addServerToNode(this.peerId, request);
    return response;
  }

  public async removeServer(
    request: RemoveServerRequest
  ): Promise<MembershipChangeResponse> {
    const response = await this.network.removeServerFromNode(
      this.peerId,
      request
    );
    return response;
  }

  public async clientQuery(key: string): Promise<ClientQueryResponse> {
    const response = this.network.clientQueryToNode(this.peerId, key);
    return response;
  }
  public async clientRequest(
    request: Command<any>
  ): Promise<ClientRequestResponse> {
    const response = await this.network.clientRequestToNode(
      this.peerId,
      request
    );
    return response;
  }
}
