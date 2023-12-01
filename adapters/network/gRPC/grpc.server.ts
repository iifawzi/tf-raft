import { Server } from "@/interfaces";
import * as grpc from "@grpc/grpc-js";
import { RaftNode } from "@/core";
import * as protoLoader from "@grpc/proto-loader";

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
    const packageDefinition = protoLoader.loadSync("./adapters/network/gRPC/protobuf/service.proto", {
      keepCase: false,
      longs: String,
      enums: Number,
      defaults: true,
      oneofs: true,
    });
    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    const server = new grpc.Server();
    server.addService((protoDescriptor.RaftNode as any).service, {
      requestVote: this.RequestVote.bind(this),
      appendEntries: this.AppendEntries.bind(this),
      addServer: this.AddServer.bind(this),
      removeServer: this.RemoveServer.bind(this),
      clientRequest: this.ClientRequest.bind(this),
      clientQuery: this.ClientQuery.bind(this),
    });
    return server;
  }

  listen(node: RaftNode): void {
    this.node = node;
    this.server.bindAsync(
      `localhost:${this.port}`,
      grpc.ServerCredentials.createInsecure(),
      (error, port) => {
        if (error) {
          console.error(`Error binding server: ${error}`);
        } else {
          this.server.start();
          console.error(`Server started on port ${port}`);
        }
      }
    );
  }

  /*************************
   RPCs
   *************************/

  public async RequestVote(
    call: any,
    callback: any
  ): Promise<void> {
    const response = await this.node.requestVoteHandler(call.request);
    callback(null, response);
  }

  public async AppendEntries(
    call: any,
    callback: any
  ): Promise<void> {
    const clientRequest = {
      ...call.request,
      entries: JSON.parse(call.request.entries),
    }
    const response = await this.node.appendEntryHandler(clientRequest);
    callback(null, response);
  }

  public async AddServer(
    call: any,
    callback: any
  ) {

    const response = await this.node.addServerHandler(call.request);
    callback(null, response);
  }

  public async RemoveServer(
    call: any,
    callback: any,
  ) {
    const response = await this.node.removeServerHandler(call.request);
    callback(null, response);
  }

  public async ClientRequest(
    call: any,
    callback: any,
  ) {
    const request = {
      ...call.request,
      data: JSON.parse(call.request.data),
    }
    await this.node.handleClientRequest(request);
    callback(null, {});
  }
  public ClientQuery(
    call: any,
    callback: any,
  ) {
    const response = this.node.handleClientQuery(call.request.key);
    callback(null, response);
  }
}
