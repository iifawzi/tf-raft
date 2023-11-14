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
    deleteFromIndexMovingForward(index: number): void;
    getLastLogEntry(): LogEntry;
    getLastIndex(): number;
    appendEntries(logs: LogEntry[]): void;
  };
  volatile: {
    getCommitIndex(): number;
    setCommitIndex(index: number): void;

    getLastApplied(): number;
    setLastApplied(): void;
  };
  volatileLeader: {
    getNextIndex(nodeId: string): number;
    setNextIndex(nodeId: string, value: number): void;

    getMatchIndex(nodeId: string): number;
    setMatchIndex(nodeId: string, value: number): void;

    // reinitialize, Ch.3 P13. 
    // matchIndex to be 0, nextIndex to be last logIndex + 1;
    reset(): void;
  };
}
