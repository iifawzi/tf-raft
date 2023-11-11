import { LogEntry } from "./LogEntry";

// Ch. 3.2 p.13
export interface StateManager {
  persistent: {
    getCurrentTerm(): number;
    setCurrentTerm(term: number): void;
    IncrementCurrentTerm(): void;

    getVotedFor(): string;
    setVotedFor(nodeId: string | null): void;

    getLog(): LogEntry[];
    getLogAtIndex(index: number): LogEntry;
    getLastLogEntry(): LogEntry;
    getLastIndex(): number;
    setLog(log: LogEntry): void;
  };
  volatile: {
    getCommitIndex(): number;
    setCommitIndex(): void;

    getLastApplied(): number;
    setLastApplied(): void;
  };
  volatileLeader: {
    getNextIndex(nodeId: string): number;
    setNextIndex(nodeId: string, value: number): void;

    getMatchIndex(nodeId: string): number;
    setMatchIndex(nodeId: string, value: number): void;
  };
}
