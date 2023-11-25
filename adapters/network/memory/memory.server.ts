import { RaftNode } from "@/core";
import { AddServerRequest, AppendEntryRequest, AppendEntryResponse, MembershipChangeResponse, RemoveServerRequest, RequestVoteRequest, RequestVoteResponse } from "@/dtos";
import { Server } from "@/interfaces";

export class MemoryServer implements Server {
  private node!: RaftNode;
  listen(node: RaftNode): void {
    this.node = node;
    console.log(`[MEMORY Server: ${node.nodeId}]: Started`)
  }

  public async RequestVote(request: RequestVoteRequest): Promise<RequestVoteResponse> {
    const response = await this.node.requestVoteHandler(request);
    return response;
  }
  
  public async AppendEntries(request: AppendEntryRequest): Promise<AppendEntryResponse> {
    const response = await this.node.appendEntryHandler(request);
    return response;
  }

  public async AddServer(request: AddServerRequest): Promise<MembershipChangeResponse> {
    const response = await this.node.addServerHandler(request);
    return response;
  }
  
  public async RemoveServer(request: RemoveServerRequest): Promise< MembershipChangeResponse> {
    const response = await this.node.removeServerHandler(request);
    return response;
  }
}
