import { AppendEntryRequest, AppendEntryResponse, RequestVoteRequest, RequestVoteResponse } from "@/dtos";
import { MemoryServer } from "./memory.server";

export class MemoryNetwork {
  public nodes: Record<string, MemoryServer> = {};

  public async requestVoteFromNode(
    nodeId: string,
    request: RequestVoteRequest
  ): Promise<RequestVoteResponse> {
    const response = await this.nodes[nodeId].RequestVote(request);
    return response;
  }

  public async appendEntriesToNode(nodeId: string, request: AppendEntryRequest): Promise<AppendEntryResponse> {
    const response = await this.nodes[nodeId].AppendEntries(request);
    return response;
  }

  public async addServer(nodeId: string, server: MemoryServer) {
    this.nodes[nodeId] = server;
  }
}
