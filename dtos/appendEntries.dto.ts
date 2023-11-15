import { LogEntry } from "@/interfaces";

export interface AppendEntryRequest {
  term: number;
  leaderId: string;
  prevLogIndex: number;
  prevLogTerm: number;
  entriesList: LogEntry[];
  leaderCommit: number; // leader's commitIndex
}

export interface AppendEntryResponse {
  term: number;
  success: boolean;
}
