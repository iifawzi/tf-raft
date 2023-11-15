// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var adapters_network_grpc_protobuf_service_pb = require('./service_pb.js');

function serialize_AppendEntriesRequest(arg) {
  if (!(arg instanceof adapters_network_grpc_protobuf_service_pb.AppendEntriesRequest)) {
    throw new Error('Expected argument of type AppendEntriesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_AppendEntriesRequest(buffer_arg) {
  return adapters_network_grpc_protobuf_service_pb.AppendEntriesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_AppendEntriesResponse(arg) {
  if (!(arg instanceof adapters_network_grpc_protobuf_service_pb.AppendEntriesResponse)) {
    throw new Error('Expected argument of type AppendEntriesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_AppendEntriesResponse(buffer_arg) {
  return adapters_network_grpc_protobuf_service_pb.AppendEntriesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_RequestVoteRequest(arg) {
  if (!(arg instanceof adapters_network_grpc_protobuf_service_pb.RequestVoteRequest)) {
    throw new Error('Expected argument of type RequestVoteRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_RequestVoteRequest(buffer_arg) {
  return adapters_network_grpc_protobuf_service_pb.RequestVoteRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_RequestVoteResponse(arg) {
  if (!(arg instanceof adapters_network_grpc_protobuf_service_pb.RequestVoteResponse)) {
    throw new Error('Expected argument of type RequestVoteResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_RequestVoteResponse(buffer_arg) {
  return adapters_network_grpc_protobuf_service_pb.RequestVoteResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var RaftNodeService = exports.RaftNodeService = {
  requestVote: {
    path: '/RaftNode/RequestVote',
    requestStream: false,
    responseStream: false,
    requestType: adapters_network_grpc_protobuf_service_pb.RequestVoteRequest,
    responseType: adapters_network_grpc_protobuf_service_pb.RequestVoteResponse,
    requestSerialize: serialize_RequestVoteRequest,
    requestDeserialize: deserialize_RequestVoteRequest,
    responseSerialize: serialize_RequestVoteResponse,
    responseDeserialize: deserialize_RequestVoteResponse,
  },
  appendEntries: {
    path: '/RaftNode/AppendEntries',
    requestStream: false,
    responseStream: false,
    requestType: adapters_network_grpc_protobuf_service_pb.AppendEntriesRequest,
    responseType: adapters_network_grpc_protobuf_service_pb.AppendEntriesResponse,
    requestSerialize: serialize_AppendEntriesRequest,
    requestDeserialize: deserialize_AppendEntriesRequest,
    responseSerialize: serialize_AppendEntriesResponse,
    responseDeserialize: deserialize_AppendEntriesResponse,
  },
};

exports.RaftNodeClient = grpc.makeGenericClientConstructor(RaftNodeService);
