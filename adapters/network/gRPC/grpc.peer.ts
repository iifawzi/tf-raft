import * as grpc from "@grpc/grpc-js";
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
import * as protoLoader from "@grpc/proto-loader";
export class gRPCPeer implements PeerConnection {
  private client!: any;
  constructor(public peerId: string, private port: number) {
    this.port = port;
    this.peerId = peerId;
    this.client = this.getClient();
  }

  /*************************
   Connections
   *************************/
  private getClient(): any {
    const packageDefinition = protoLoader.loadSync(
      "./adapters/network/gRPC/protobuf/service.proto",
      {
        keepCase: false,
        longs: String,
        enums: Number,
        defaults: true,
        oneofs: true,
      }
    );
    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    const client = new (protoDescriptor as any).RaftNode(
      `localhost:${this.port}`,
      grpc.credentials.createInsecure()
    );
    return client;
  }

  async requestVote(
    request: RequestVoteRequest,
    callback: (response: RequestVoteResponse) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.requestVote(
        request,
        (error: any, response: RequestVoteResponse) => {
          if (error) {
            reject(error);
          } else {
            callback(response);
            resolve();
          }
        }
      );
    });
  }

  async appendEntries(
    request: AppendEntryRequest,
    callback: (response: AppendEntryResponse) => void
  ): Promise<void> {
    const grpcRequest = {
      ...request,
      entries: JSON.stringify(request.entries),
    };
    return new Promise((resolve, reject) => {
      this.client.appendEntries(
        grpcRequest,
        (error: any, response: AppendEntryResponse) => {
          if (error) {
            reject(error);
          } else {
            callback(response);
            resolve();
          }
        }
      );
    });
  }

  // used by clients / admins
  async addServer(
    request: AddServerRequest
  ): Promise<MembershipChangeResponse> {
    return new Promise((resolve, reject) => {
      this.client.addServer(
        request,
        (error: any, response: MembershipChangeResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }
  async removeServer(
    request: RemoveServerRequest
  ): Promise<MembershipChangeResponse> {
    return new Promise((resolve, reject) => {
      this.client.removeServer(
        request,
        (error: any, response: MembershipChangeResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  async clientRequest(request: Command<any>): Promise<ClientRequestResponse> {
    const grpcRequest = {
      ...request,
      data: JSON.stringify(request.data),
    };
    return new Promise((resolve, reject) => {
      this.client.clientRequest(
        grpcRequest,
        (error: any, response: ClientRequestResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  async clientQuery(key: string): Promise<ClientQueryResponse> {
    return new Promise((resolve, reject) => {
      this.client.clientQuery(
        { key },
        (error: any, response: ClientQueryResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }
}
