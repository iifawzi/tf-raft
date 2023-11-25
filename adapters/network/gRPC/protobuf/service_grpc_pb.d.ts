// package: 
// file: adapters/network/grpc/protobuf/service.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as adapters_network_grpc_protobuf_service_pb from "./service_pb";

interface IRaftNodeService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    requestVote: IRaftNodeService_IRequestVote;
    appendEntries: IRaftNodeService_IAppendEntries;
    addServer: IRaftNodeService_IAddServer;
    removeServer: IRaftNodeService_IRemoveServer;
}

interface IRaftNodeService_IRequestVote extends grpc.MethodDefinition<adapters_network_grpc_protobuf_service_pb.RequestVoteRequest, adapters_network_grpc_protobuf_service_pb.RequestVoteResponse> {
    path: "/RaftNode/RequestVote";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<adapters_network_grpc_protobuf_service_pb.RequestVoteRequest>;
    requestDeserialize: grpc.deserialize<adapters_network_grpc_protobuf_service_pb.RequestVoteRequest>;
    responseSerialize: grpc.serialize<adapters_network_grpc_protobuf_service_pb.RequestVoteResponse>;
    responseDeserialize: grpc.deserialize<adapters_network_grpc_protobuf_service_pb.RequestVoteResponse>;
}
interface IRaftNodeService_IAppendEntries extends grpc.MethodDefinition<adapters_network_grpc_protobuf_service_pb.AppendEntriesRequest, adapters_network_grpc_protobuf_service_pb.AppendEntriesResponse> {
    path: "/RaftNode/AppendEntries";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<adapters_network_grpc_protobuf_service_pb.AppendEntriesRequest>;
    requestDeserialize: grpc.deserialize<adapters_network_grpc_protobuf_service_pb.AppendEntriesRequest>;
    responseSerialize: grpc.serialize<adapters_network_grpc_protobuf_service_pb.AppendEntriesResponse>;
    responseDeserialize: grpc.deserialize<adapters_network_grpc_protobuf_service_pb.AppendEntriesResponse>;
}
interface IRaftNodeService_IAddServer extends grpc.MethodDefinition<adapters_network_grpc_protobuf_service_pb.AddServerRequest, adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse> {
    path: "/RaftNode/AddServer";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<adapters_network_grpc_protobuf_service_pb.AddServerRequest>;
    requestDeserialize: grpc.deserialize<adapters_network_grpc_protobuf_service_pb.AddServerRequest>;
    responseSerialize: grpc.serialize<adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse>;
    responseDeserialize: grpc.deserialize<adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse>;
}
interface IRaftNodeService_IRemoveServer extends grpc.MethodDefinition<adapters_network_grpc_protobuf_service_pb.RemoveServerRequest, adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse> {
    path: "/RaftNode/RemoveServer";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<adapters_network_grpc_protobuf_service_pb.RemoveServerRequest>;
    requestDeserialize: grpc.deserialize<adapters_network_grpc_protobuf_service_pb.RemoveServerRequest>;
    responseSerialize: grpc.serialize<adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse>;
    responseDeserialize: grpc.deserialize<adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse>;
}

export const RaftNodeService: IRaftNodeService;

export interface IRaftNodeServer extends grpc.UntypedServiceImplementation {
    requestVote: grpc.handleUnaryCall<adapters_network_grpc_protobuf_service_pb.RequestVoteRequest, adapters_network_grpc_protobuf_service_pb.RequestVoteResponse>;
    appendEntries: grpc.handleUnaryCall<adapters_network_grpc_protobuf_service_pb.AppendEntriesRequest, adapters_network_grpc_protobuf_service_pb.AppendEntriesResponse>;
    addServer: grpc.handleUnaryCall<adapters_network_grpc_protobuf_service_pb.AddServerRequest, adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse>;
    removeServer: grpc.handleUnaryCall<adapters_network_grpc_protobuf_service_pb.RemoveServerRequest, adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse>;
}

export interface IRaftNodeClient {
    requestVote(request: adapters_network_grpc_protobuf_service_pb.RequestVoteRequest, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.RequestVoteResponse) => void): grpc.ClientUnaryCall;
    requestVote(request: adapters_network_grpc_protobuf_service_pb.RequestVoteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.RequestVoteResponse) => void): grpc.ClientUnaryCall;
    requestVote(request: adapters_network_grpc_protobuf_service_pb.RequestVoteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.RequestVoteResponse) => void): grpc.ClientUnaryCall;
    appendEntries(request: adapters_network_grpc_protobuf_service_pb.AppendEntriesRequest, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.AppendEntriesResponse) => void): grpc.ClientUnaryCall;
    appendEntries(request: adapters_network_grpc_protobuf_service_pb.AppendEntriesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.AppendEntriesResponse) => void): grpc.ClientUnaryCall;
    appendEntries(request: adapters_network_grpc_protobuf_service_pb.AppendEntriesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.AppendEntriesResponse) => void): grpc.ClientUnaryCall;
    addServer(request: adapters_network_grpc_protobuf_service_pb.AddServerRequest, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse) => void): grpc.ClientUnaryCall;
    addServer(request: adapters_network_grpc_protobuf_service_pb.AddServerRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse) => void): grpc.ClientUnaryCall;
    addServer(request: adapters_network_grpc_protobuf_service_pb.AddServerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse) => void): grpc.ClientUnaryCall;
    removeServer(request: adapters_network_grpc_protobuf_service_pb.RemoveServerRequest, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse) => void): grpc.ClientUnaryCall;
    removeServer(request: adapters_network_grpc_protobuf_service_pb.RemoveServerRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse) => void): grpc.ClientUnaryCall;
    removeServer(request: adapters_network_grpc_protobuf_service_pb.RemoveServerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse) => void): grpc.ClientUnaryCall;
}

export class RaftNodeClient extends grpc.Client implements IRaftNodeClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public requestVote(request: adapters_network_grpc_protobuf_service_pb.RequestVoteRequest, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.RequestVoteResponse) => void): grpc.ClientUnaryCall;
    public requestVote(request: adapters_network_grpc_protobuf_service_pb.RequestVoteRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.RequestVoteResponse) => void): grpc.ClientUnaryCall;
    public requestVote(request: adapters_network_grpc_protobuf_service_pb.RequestVoteRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.RequestVoteResponse) => void): grpc.ClientUnaryCall;
    public appendEntries(request: adapters_network_grpc_protobuf_service_pb.AppendEntriesRequest, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.AppendEntriesResponse) => void): grpc.ClientUnaryCall;
    public appendEntries(request: adapters_network_grpc_protobuf_service_pb.AppendEntriesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.AppendEntriesResponse) => void): grpc.ClientUnaryCall;
    public appendEntries(request: adapters_network_grpc_protobuf_service_pb.AppendEntriesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.AppendEntriesResponse) => void): grpc.ClientUnaryCall;
    public addServer(request: adapters_network_grpc_protobuf_service_pb.AddServerRequest, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse) => void): grpc.ClientUnaryCall;
    public addServer(request: adapters_network_grpc_protobuf_service_pb.AddServerRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse) => void): grpc.ClientUnaryCall;
    public addServer(request: adapters_network_grpc_protobuf_service_pb.AddServerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse) => void): grpc.ClientUnaryCall;
    public removeServer(request: adapters_network_grpc_protobuf_service_pb.RemoveServerRequest, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse) => void): grpc.ClientUnaryCall;
    public removeServer(request: adapters_network_grpc_protobuf_service_pb.RemoveServerRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse) => void): grpc.ClientUnaryCall;
    public removeServer(request: adapters_network_grpc_protobuf_service_pb.RemoveServerRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse) => void): grpc.ClientUnaryCall;
}
