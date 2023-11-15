import grpc from "@grpc/grpc-js";
import {
  RequestVoteRequest,
  RequestVoteResponse,
  AppendEntryRequest,
  AppendEntryResponse,
} from "@/dtos";
import messages from "./protobuf/service_pb";
import { PeerConnection } from "@/interfaces";
import { RaftNodeClient } from "./protobuf/service_grpc_pb";

export class gRPCServer implements PeerConnection {
  private client!: RaftNodeClient;
  constructor(public peerId: string, private port: number) {
    this.port = port;
    this.peerId = peerId;
    this.client = this.getClient();
  }

  /*************************
   Connections
   *************************/
  private getClient(): RaftNodeClient {
    const client = new RaftNodeClient(
      `0.0.0.0:${this.port}`,
      grpc.credentials.createInsecure()
    );
    return client;
  }

  async requestVote(request: RequestVoteRequest): Promise<RequestVoteResponse> {
    return new Promise((resolve, reject) => {
      const grpcRequest = new messages.RequestVoteRequest()
        .setTerm(request.term)
        .setLastLogTerm(request.lastLogTerm)
        .setLastLogIndex(request.lastLogIndex)
        .setCandidateId(request.candidateId);

      this.client.requestVote(grpcRequest, (error, response) => {
        if (error) {
          reject(error);
        } else {
          const clientResponse: RequestVoteResponse = {
            term: response.getTerm(),
            voteGranted: response.getVoteGranted(),
          };
          resolve(clientResponse);
        }
      });
    });
  }

  async appendEntries(
    request: AppendEntryRequest
  ): Promise<AppendEntryResponse> {
    return new Promise((resolve, reject) => {
      const grpcRequest = new messages.AppendEntriesRequest()
        .setTerm(request.term)
        .setPrevLogTerm(request.prevLogTerm)
        .setPrevLogIndex(request.prevLogIndex)
        .setLeaderId(request.leaderId)
        .setLeaderCommit(request.leaderCommit)
        .setEntriesList(
          request.entriesList.map((entry) => {
            return new messages.LogEntry()
              .setTerm(entry.term)
              .setCommand(entry.command);
          })
        );
      this.client.appendEntries(grpcRequest, (error, response) => {
        if (error) {
          reject(error);
        } else {
          const clientResponse: AppendEntryResponse = {
            term: response.getTerm(),
            success: response.getSuccess(),
          };
          resolve(clientResponse);
        }
      });
    });
  }
}
