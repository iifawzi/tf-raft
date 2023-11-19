import { RaftNode } from "@/core";
import { AppendEntryRequest, AppendEntryResponse, RequestVoteRequest, RequestVoteResponse } from "@/dtos";
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
}
