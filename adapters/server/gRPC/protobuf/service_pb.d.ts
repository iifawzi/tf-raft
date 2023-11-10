// package: 
// file: adapters/server/grpc/protobuf/service.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class RequestVoteRequest extends jspb.Message { 
    getTerm(): number;
    setTerm(value: number): RequestVoteRequest;
    getCandidateId(): string;
    setCandidateId(value: string): RequestVoteRequest;
    getLastLogIndex(): number;
    setLastLogIndex(value: number): RequestVoteRequest;
    getLastLogTerm(): number;
    setLastLogTerm(value: number): RequestVoteRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RequestVoteRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RequestVoteRequest): RequestVoteRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RequestVoteRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RequestVoteRequest;
    static deserializeBinaryFromReader(message: RequestVoteRequest, reader: jspb.BinaryReader): RequestVoteRequest;
}

export namespace RequestVoteRequest {
    export type AsObject = {
        term: number,
        candidateId: string,
        lastLogIndex: number,
        lastLogTerm: number,
    }
}

export class RequestVoteResponse extends jspb.Message { 
    getTerm(): number;
    setTerm(value: number): RequestVoteResponse;
    getVoteGranted(): boolean;
    setVoteGranted(value: boolean): RequestVoteResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RequestVoteResponse.AsObject;
    static toObject(includeInstance: boolean, msg: RequestVoteResponse): RequestVoteResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RequestVoteResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RequestVoteResponse;
    static deserializeBinaryFromReader(message: RequestVoteResponse, reader: jspb.BinaryReader): RequestVoteResponse;
}

export namespace RequestVoteResponse {
    export type AsObject = {
        term: number,
        voteGranted: boolean,
    }
}
