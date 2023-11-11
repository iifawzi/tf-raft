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
    getNextIndex(): [];
    setNextIndex(): void;

    getMatchIndex(): [];
    setMatchIndex(): void;
  };
}
