// package: 
// file: adapters/network/grpc/protobuf/service.proto

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

export class AppendEntriesRequest extends jspb.Message { 
    getTerm(): number;
    setTerm(value: number): AppendEntriesRequest;
    getLeaderId(): string;
    setLeaderId(value: string): AppendEntriesRequest;
    getPrevLogIndex(): number;
    setPrevLogIndex(value: number): AppendEntriesRequest;
    getPrevLogTerm(): number;
    setPrevLogTerm(value: number): AppendEntriesRequest;
    clearEntriesList(): void;
    getEntriesList(): Array<LogEntry>;
    setEntriesList(value: Array<LogEntry>): AppendEntriesRequest;
    addEntries(value?: LogEntry, index?: number): LogEntry;
    getLeaderCommit(): number;
    setLeaderCommit(value: number): AppendEntriesRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AppendEntriesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AppendEntriesRequest): AppendEntriesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AppendEntriesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AppendEntriesRequest;
    static deserializeBinaryFromReader(message: AppendEntriesRequest, reader: jspb.BinaryReader): AppendEntriesRequest;
}

export namespace AppendEntriesRequest {
    export type AsObject = {
        term: number,
        leaderId: string,
        prevLogIndex: number,
        prevLogTerm: number,
        entriesList: Array<LogEntry.AsObject>,
        leaderCommit: number,
    }
}

export class AppendEntriesResponse extends jspb.Message { 
    getTerm(): number;
    setTerm(value: number): AppendEntriesResponse;
    getSuccess(): boolean;
    setSuccess(value: boolean): AppendEntriesResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AppendEntriesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: AppendEntriesResponse): AppendEntriesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AppendEntriesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AppendEntriesResponse;
    static deserializeBinaryFromReader(message: AppendEntriesResponse, reader: jspb.BinaryReader): AppendEntriesResponse;
}

export namespace AppendEntriesResponse {
    export type AsObject = {
        term: number,
        success: boolean,
    }
}

export class AddServerRequest extends jspb.Message { 
    getNewServer(): string;
    setNewServer(value: string): AddServerRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): AddServerRequest.AsObject;
    static toObject(includeInstance: boolean, msg: AddServerRequest): AddServerRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: AddServerRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): AddServerRequest;
    static deserializeBinaryFromReader(message: AddServerRequest, reader: jspb.BinaryReader): AddServerRequest;
}

export namespace AddServerRequest {
    export type AsObject = {
        newServer: string,
    }
}

export class RemoveServerRequest extends jspb.Message { 
    getOldServer(): string;
    setOldServer(value: string): RemoveServerRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): RemoveServerRequest.AsObject;
    static toObject(includeInstance: boolean, msg: RemoveServerRequest): RemoveServerRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: RemoveServerRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): RemoveServerRequest;
    static deserializeBinaryFromReader(message: RemoveServerRequest, reader: jspb.BinaryReader): RemoveServerRequest;
}

export namespace RemoveServerRequest {
    export type AsObject = {
        oldServer: string,
    }
}

export class MembershipChangeResponse extends jspb.Message { 
    getStatus(): MEMBERSHIP_CHANGES_RESPONSES;
    setStatus(value: MEMBERSHIP_CHANGES_RESPONSES): MembershipChangeResponse;
    getLeaderHint(): string;
    setLeaderHint(value: string): MembershipChangeResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): MembershipChangeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: MembershipChangeResponse): MembershipChangeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: MembershipChangeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): MembershipChangeResponse;
    static deserializeBinaryFromReader(message: MembershipChangeResponse, reader: jspb.BinaryReader): MembershipChangeResponse;
}

export namespace MembershipChangeResponse {
    export type AsObject = {
        status: MEMBERSHIP_CHANGES_RESPONSES,
        leaderHint: string,
    }
}

export class LogEntry extends jspb.Message { 
    getTerm(): number;
    setTerm(value: number): LogEntry;
    getCommand(): string;
    setCommand(value: string): LogEntry;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LogEntry.AsObject;
    static toObject(includeInstance: boolean, msg: LogEntry): LogEntry.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LogEntry, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LogEntry;
    static deserializeBinaryFromReader(message: LogEntry, reader: jspb.BinaryReader): LogEntry;
}

export namespace LogEntry {
    export type AsObject = {
        term: number,
        command: string,
    }
}

export enum MEMBERSHIP_CHANGES_RESPONSES {
    OK = 0,
    NOT_LEADER = 1,
}
