import {
  AddServerRequest,
  AppendEntryRequest,
  AppendEntryResponse,
  ClientQueryResponse,
  ClientRequestResponse,
  MembershipChangeResponse,
  RemoveServerRequest,
  RequestVoteRequest,
  RequestVoteResponse,
} from "@/dtos";
import { MemoryServer } from "./memory.server";
import { Command, Query } from "@/interfaces";

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

  public async addServerToNode(
    nodeId: string,
    request: AddServerRequest
  ): Promise<MembershipChangeResponse> {
    const response = await this.nodes[nodeId].AddServer(request);
    return response;
  }

  public async removeServerFromNode(
    nodeId: string,
    request: RemoveServerRequest
  ): Promise<MembershipChangeResponse> {
    const response = await this.nodes[nodeId].RemoveServer(request);
    return response;
  }

  public clientQueryToNode(
    nodeId: string,
    query: Query
  ): ClientQueryResponse {
    const response = this.nodes[nodeId].ClientQuery(query);
    return response;
  }

  public async clientRequestToNode(
    nodeId: string,
    request: Command<any>
  ): Promise<ClientRequestResponse> {
    const response = await this.nodes[nodeId].ClientRequest(request);
    return response;
  }

  // adding server to the network.
  public async addServer(nodeId: string, server: MemoryServer) {
    this.nodes[nodeId] = server;
  }
}
