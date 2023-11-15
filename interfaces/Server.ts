import { RaftNode } from "@/core";

export interface Server {
  listen(node: RaftNode): void;
  RequestVote: (...args: any[]) => any;
  AppendEntries: (...args: any[]) => any;
}
