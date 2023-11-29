// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var adapters_network_grpc_protobuf_service_pb = require('./service_pb.js');

function serialize_AddServerRequest(arg) {
  if (!(arg instanceof adapters_network_grpc_protobuf_service_pb.AddServerRequest)) {
    throw new Error('Expected argument of type AddServerRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_AddServerRequest(buffer_arg) {
  return adapters_network_grpc_protobuf_service_pb.AddServerRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

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

function serialize_ClientQueryRequest(arg) {
  if (!(arg instanceof adapters_network_grpc_protobuf_service_pb.ClientQueryRequest)) {
    throw new Error('Expected argument of type ClientQueryRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_ClientQueryRequest(buffer_arg) {
  return adapters_network_grpc_protobuf_service_pb.ClientQueryRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_ClientQueryResponse(arg) {
  if (!(arg instanceof adapters_network_grpc_protobuf_service_pb.ClientQueryResponse)) {
    throw new Error('Expected argument of type ClientQueryResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_ClientQueryResponse(buffer_arg) {
  return adapters_network_grpc_protobuf_service_pb.ClientQueryResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_ClientRequestRequest(arg) {
  if (!(arg instanceof adapters_network_grpc_protobuf_service_pb.ClientRequestRequest)) {
    throw new Error('Expected argument of type ClientRequestRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_ClientRequestRequest(buffer_arg) {
  return adapters_network_grpc_protobuf_service_pb.ClientRequestRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_MembershipChangeResponse(arg) {
  if (!(arg instanceof adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse)) {
    throw new Error('Expected argument of type MembershipChangeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_MembershipChangeResponse(buffer_arg) {
  return adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_NoResponse(arg) {
  if (!(arg instanceof adapters_network_grpc_protobuf_service_pb.NoResponse)) {
    throw new Error('Expected argument of type NoResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_NoResponse(buffer_arg) {
  return adapters_network_grpc_protobuf_service_pb.NoResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_RemoveServerRequest(arg) {
  if (!(arg instanceof adapters_network_grpc_protobuf_service_pb.RemoveServerRequest)) {
    throw new Error('Expected argument of type RemoveServerRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_RemoveServerRequest(buffer_arg) {
  return adapters_network_grpc_protobuf_service_pb.RemoveServerRequest.deserializeBinary(new Uint8Array(buffer_arg));
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
  addServer: {
    path: '/RaftNode/AddServer',
    requestStream: false,
    responseStream: false,
    requestType: adapters_network_grpc_protobuf_service_pb.AddServerRequest,
    responseType: adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse,
    requestSerialize: serialize_AddServerRequest,
    requestDeserialize: deserialize_AddServerRequest,
    responseSerialize: serialize_MembershipChangeResponse,
    responseDeserialize: deserialize_MembershipChangeResponse,
  },
  removeServer: {
    path: '/RaftNode/RemoveServer',
    requestStream: false,
    responseStream: false,
    requestType: adapters_network_grpc_protobuf_service_pb.RemoveServerRequest,
    responseType: adapters_network_grpc_protobuf_service_pb.MembershipChangeResponse,
    requestSerialize: serialize_RemoveServerRequest,
    requestDeserialize: deserialize_RemoveServerRequest,
    responseSerialize: serialize_MembershipChangeResponse,
    responseDeserialize: deserialize_MembershipChangeResponse,
  },
  clientRequest: {
    path: '/RaftNode/ClientRequest',
    requestStream: false,
    responseStream: false,
    requestType: adapters_network_grpc_protobuf_service_pb.ClientRequestRequest,
    responseType: adapters_network_grpc_protobuf_service_pb.NoResponse,
    requestSerialize: serialize_ClientRequestRequest,
    requestDeserialize: deserialize_ClientRequestRequest,
    responseSerialize: serialize_NoResponse,
    responseDeserialize: deserialize_NoResponse,
  },
  clientQuery: {
    path: '/RaftNode/ClientQuery',
    requestStream: false,
    responseStream: false,
    requestType: adapters_network_grpc_protobuf_service_pb.ClientQueryRequest,
    responseType: adapters_network_grpc_protobuf_service_pb.ClientQueryResponse,
    requestSerialize: serialize_ClientQueryRequest,
    requestDeserialize: deserialize_ClientQueryRequest,
    responseSerialize: serialize_ClientQueryResponse,
    responseDeserialize: deserialize_ClientQueryResponse,
  },
};

exports.RaftNodeClient = grpc.makeGenericClientConstructor(RaftNodeService);
