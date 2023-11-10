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

   RequestVote(call: grpc.ServerUnaryCall<messages.RequestVoteRequest.AsObject, null>, callback: grpc.sendUnaryData<messages.RequestVoteResponse>): void {
    const response = this.node.requestVoteHandler(call.request);
    // callback(null, response);
  }

}
