import { LogEntry } from "./LogEntry";

// Ch. 3.2 p.13
export interface StateManager {
  // Persistent:
  getCurrentTerm(): Promise<number>;
  setCurrentTerm(term: number): Promise<void>;
  IncrementCurrentTerm(): Promise<void>;

  getVotedFor(): Promise<string>;
  setVotedFor(nodeId: string | null): Promise<void>;

  getLog(): Promise<LogEntry[]>;
  deleteFromIndexMovingForward(index: number): Promise<void>;
  appendEntries(logs: LogEntry[]): Promise<void>;
  getLogAtIndex(index: number): Promise<LogEntry>;
  getLastLogEntry(): Promise<LogEntry>;
  getLastIndex(): Promise<number>;

  // Volatile:
  getCommitIndex(): number;
  setCommitIndex(index: number): void;

  getLastApplied(): number;
  setLastApplied(index: number): void;

  // Volatile Leader :

  getNextIndex(nodeId: string): number;
  setNextIndex(nodeId: string, value: number): void;

  getMatchIndex(nodeId: string): number;
  setMatchIndex(nodeId: string, value: number): void;

  // reinitialize, Ch.3 P13.
  // matchIndex to be 0, nextIndex to be last logIndex + 1;
  reset(): void;
}
