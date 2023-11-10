// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var adapters_server_grpc_protobuf_service_pb = require('../../../../adapters/server/grpc/protobuf/service_pb.js');

function serialize_RequestVoteRequest(arg) {
  if (!(arg instanceof adapters_server_grpc_protobuf_service_pb.RequestVoteRequest)) {
    throw new Error('Expected argument of type RequestVoteRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_RequestVoteRequest(buffer_arg) {
  return adapters_server_grpc_protobuf_service_pb.RequestVoteRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_RequestVoteResponse(arg) {
  if (!(arg instanceof adapters_server_grpc_protobuf_service_pb.RequestVoteResponse)) {
    throw new Error('Expected argument of type RequestVoteResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_RequestVoteResponse(buffer_arg) {
  return adapters_server_grpc_protobuf_service_pb.RequestVoteResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var RaftNodeService = exports.RaftNodeService = {
  requestVote: {
    path: '/RaftNode/RequestVote',
    requestStream: false,
    responseStream: false,
    requestType: adapters_server_grpc_protobuf_service_pb.RequestVoteRequest,
    responseType: adapters_server_grpc_protobuf_service_pb.RequestVoteResponse,
    requestSerialize: serialize_RequestVoteRequest,
    requestDeserialize: deserialize_RequestVoteRequest,
    responseSerialize: serialize_RequestVoteResponse,
    responseDeserialize: deserialize_RequestVoteResponse,
  },
};

exports.RaftNodeClient = grpc.makeGenericClientConstructor(RaftNodeService);
