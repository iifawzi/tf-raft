import { RaftNode } from "@/core";

export interface Server {
  listen(node: RaftNode): void;
  RequestVote(...args: any[]): any;
  AppendEntries(...args: any[]): any;
  AddServer(...args: any[]): any;
  RemoveServer(...args: any[]): any;
  // client requests are meant to do change to the machine's state.
  ClientRequest(...args: any[]): any;
  // only queries
  ClientQuery(...args: any[]): any;
}
