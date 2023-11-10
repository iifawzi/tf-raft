// package: 
// file: adapters/server/grpc/protobuf/service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as adapters_server_grpc_protobuf_service_pb from "./service_pb";

interface IRaftNodeService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    requestVote: IRaftNodeService_IRequestVote;
}

interface IRaftNodeService_IRequestVote extends grpc.MethodDefinition<adapters_server_grpc_protobuf_service_pb.RequestVoteRequest, adapters_server_grpc_protobuf_service_pb.RequestVoteResponse> {
    path: "/RaftNode/RequestVote";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<adapters_server_grpc_protobuf_service_pb.RequestVoteRequest>;
    requestDeserialize: grpc.deserialize<adapters_server_grpc_protobuf_service_pb.RequestVoteRequest>;
    responseSerialize: grpc.serialize<adapters_server_grpc_protobuf_service_pb.RequestVoteResponse>;
    responseDeserialize: grpc.deserialize<adapters_server_grpc_protobuf_service_pb.RequestVoteResponse>;
}

export const RaftNodeService: IRaftNodeService;

export interface IRaftNodeServer extends grpc.UntypedServiceImplementation {
    requestVote: grpc.handleUnaryCall<adapters_server_grpc_protobuf_service_pb.RequestVoteRequest, adapters_server_grpc_protobuf_service_pb.RequestVoteResponse>;
}

export interface IRaftNodeClient {
    requestVote(request: adapters_server_grpc_protobuf_service_pb.RequestVoteRequest, callback: (error: grpc.ServiceError | null, response: adapters_server_grpc_protobuf_service_pb.RequestVoteResponse) => void): grpc.ClientUnaryCall;
    requestVote(request: adapters_server_grpc_protobuf_service_pb.RequestVoteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: adapters_server_grpc_protobuf_service_pb.RequestVoteResponse) => void): grpc.ClientUnaryCall;
    requestVote(request: adapters_server_grpc_protobuf_service_pb.RequestVoteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: adapters_server_grpc_protobuf_service_pb.RequestVoteResponse) => void): grpc.ClientUnaryCall;
}

export class RaftNodeClient extends grpc.Client implements IRaftNodeClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public requestVote(request: adapters_server_grpc_protobuf_service_pb.RequestVoteRequest, callback: (error: grpc.ServiceError | null, response: adapters_server_grpc_protobuf_service_pb.RequestVoteResponse) => void): grpc.ClientUnaryCall;
    public requestVote(request: adapters_server_grpc_protobuf_service_pb.RequestVoteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: adapters_server_grpc_protobuf_service_pb.RequestVoteResponse) => void): grpc.ClientUnaryCall;
    public requestVote(request: adapters_server_grpc_protobuf_service_pb.RequestVoteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: adapters_server_grpc_protobuf_service_pb.RequestVoteResponse) => void): grpc.ClientUnaryCall;
}
