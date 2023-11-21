import {
  AppendEntryRequest,
  AppendEntryResponse,
  RequestVoteRequest,
  RequestVoteResponse,
} from "@/dtos";
import { MemoryServer } from "./memory.server";

export class MemoryNetwork {
  public nodes: Record<string, MemoryServer> = {};
  private static instance: MemoryNetwork | undefined = undefined;
  private constructor() {}

  public static getNetwork() {
    if (!this.instance) {
      this.instance = new MemoryNetwork();
    }
    return this.instance;
  }

  // return new instance each time its called
  public static getTestNetwork() {
    this.instance = new MemoryNetwork();
    return this.instance;
  }

  public async requestVoteFromNode(
    nodeId: string,
    request: RequestVoteRequest
  ): Promise<RequestVoteResponse> {
    const response = await this.nodes[nodeId].RequestVote(request);
    return response;
  }

  public async appendEntriesToNode(
    nodeId: string,
    request: AppendEntryRequest
  ): Promise<AppendEntryResponse> {
    const response = await this.nodes[nodeId].AppendEntries(request);
    return response;
  }

  public async addServer(nodeId: string, server: MemoryServer) {
    this.nodes[nodeId] = server;
  }
}
