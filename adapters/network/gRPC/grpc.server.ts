import { Server } from "@/interfaces";
import grpc from "@grpc/grpc-js";
import messages from "./protobuf/service_pb";
import services from "./protobuf/service_grpc_pb";
import { RaftNode } from "@/core";

export class gRPCServer implements Server {
  private node!: RaftNode;
  private server: grpc.Server;

  constructor(private port: number) {
    this.port = port;
    this.server = this.getServer();
  }

  /*************************
   Connections
   *************************/
  private getServer() {
    const server = new grpc.Server();
    server.addService(services.RaftNodeService, {
      RequestVote: this.RequestVote,
    });
    return server;
  }

  listen(node: RaftNode): void {
    this.node = node;
    this.server.bindAsync(
      `0.0.0.0:${this.port}`,
      grpc.ServerCredentials.createInsecure(),
      (error, port) => {
        if (error) {
          console.error(`Error binding server: ${error}`);
        } else {
          this.server.start();
          console.log(`Server started on port ${port}`);
        }
      }
    );
  }

  /*************************
   RPCs
   *************************/

   async RequestVote(call: grpc.ServerUnaryCall<messages.RequestVoteRequest.AsObject, null>, callback: grpc.sendUnaryData<messages.RequestVoteResponse>): Promise<void> {
    const response = await this.node.requestVoteHandler(call.request);
    const grpcResponse = new messages.RequestVoteResponse(); 
    grpcResponse.setTerm(response.term);
    grpcResponse.setVoteGranted(response.voteGranted);
    callback(null, grpcResponse);
  }

  async AppendEntries(call: grpc.ServerUnaryCall<messages.AppendEntriesRequest.AsObject, null>, callback: grpc.sendUnaryData<messages.AppendEntriesResponse>): Promise<void> {
    const response = await this.node.appendEntryHandler(call.request);
    const grpcResponse = new messages.AppendEntriesResponse(); 
    grpcResponse.setTerm(response.term);
    grpcResponse.setSuccess(response.success);
    callback(null, grpcResponse);
  }

  async AddServer(call: grpc.ServerUnaryCall<messages.AddServerRequest.AsObject, null>, callback: grpc.sendUnaryData<messages.MembershipChangeResponse>) {
    const response = await this.node.addServerHandler(call.request);
    const grpcResponse = new messages.MembershipChangeResponse(); 
    grpcResponse.setStatus(response.status);
    grpcResponse.setLeaderHint(response.leaderHint);
    callback(null, grpcResponse);
  }
  
  async RemoveServer(call: grpc.ServerUnaryCall<messages.RemoveServerRequest.AsObject, null>, callback: grpc.sendUnaryData<messages.MembershipChangeResponse>) {
    const response = await this.node.removeServerHandler(call.request);
    const grpcResponse = new messages.MembershipChangeResponse(); 
    grpcResponse.setStatus(response.status);
    grpcResponse.setLeaderHint(response.leaderHint);
    callback(null, grpcResponse);
  }

}
