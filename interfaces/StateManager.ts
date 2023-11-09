// Ch. 3.2 p.13
export interface StateManager {
  persistent: {
    getCurrentTerm(): number;
    IncrementCurrentTerm(): void;

    getVotedFor(): number;
    setVotedFor(nodeId: string): void;

    getLog(): [];
    setLog(): void;
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
