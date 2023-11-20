import { LocalStateManager } from "@/adapters/state";

describe("LocalStateManager", () => {
  console.log = jest.fn();
  let stateManager: LocalStateManager = new LocalStateManager("TEST_NODE1");

  beforeEach(async () => {
    stateManager = new LocalStateManager("NODE1");
    await stateManager.start();
  });

  describe("Persistent state", () => {
    describe("Initial values", () => {
      it("currentTerm should be initialized with '-1'", async () => {
        const currentTerm = await stateManager.getCurrentTerm();
        expect(currentTerm).toEqual(-1);
      });

      it("votedFor should be initialized with '-1'", async () => {
        const votedFor = await stateManager.getVotedFor();
        expect(votedFor).toEqual(-1);
      });

      it("LOG should be initialized with empty array", async () => {
        const log = await stateManager.getLog();
        expect(log).toEqual([]);
        expect(log.length).toEqual(0);
      });
    });

    describe("Setters", () => {
      it("Current term setter should set the term correctly", async () => {
        await stateManager.setCurrentTerm(1);
        const currentTerm = await stateManager.getCurrentTerm();
        expect(currentTerm).toEqual(1);
      });

      it("Current term should be incremented correctly", async () => {
        await stateManager.IncrementCurrentTerm();
        const currentTerm = await stateManager.getCurrentTerm();
        expect(currentTerm).toEqual(0);
      });

      it("Voted for setter should set the value correctly", async () => {
        await stateManager.setVotedFor("TEST_NODE2");
        const votedFor = await stateManager.getVotedFor();
        expect(votedFor).toEqual("TEST_NODE2");
      });

      it("Entries should be appended to log correctly", async () => {
        const entry = { term: 1, command: "TEST" };
        await stateManager.appendEntries([entry]);
        const logEntry = await stateManager.getLastLogEntry();
        expect(logEntry.term).toEqual(entry.term);
        expect(logEntry.command).toEqual("TEST");
      });

      it("Entries should be deleted successfully", async () => {
        const entries = [
          { term: 1, command: "TEST" },
          { term: 1, command: "TEST1" },
          { term: 1, command: "TEST2" },
          { term: 1, command: "TEST3" },
        ];
        await stateManager.appendEntries(entries);
        await stateManager.deleteFromIndexMovingForward(1);
        const logs = await stateManager.getLog();
        expect(logs.length).toEqual(1);
        const lastLog = await stateManager.getLastLogEntry();
        expect(lastLog.term).toEqual(1);
        expect(lastLog.command).toEqual("TEST");
      });
    });

    describe("Getters", () => {
      it("Should return specified log based on the index, correctly", async () => {
        const entries = [
          { term: 1, command: "TEST" },
          { term: 1, command: "TEST1" },
          { term: 1, command: "TEST2" },
          { term: 1, command: "TEST3" },
        ];
        await stateManager.appendEntries(entries);
        const logEntry = await stateManager.getLogAtIndex(1);
        expect(logEntry.term).toEqual(1);
        expect(logEntry.command).toEqual("TEST1");
      });

      it("Should get last log entry correctly", async () => {
        const entries = [
          { term: 1, command: "TEST" },
          { term: 1, command: "TEST1" },
          { term: 1, command: "TEST2" },
          { term: 1, command: "TEST3" },
        ];
        await stateManager.appendEntries(entries);
        const logEntry = await stateManager.getLastLogEntry();
        expect(logEntry.term).toEqual(1);
        expect(logEntry.command).toEqual("TEST3");
      });

      it("Should get last log index correctly", async () => {
        const entries = [
          { term: 1, command: "TEST" },
          { term: 1, command: "TEST1" },
          { term: 1, command: "TEST2" },
          { term: 1, command: "TEST3" },
        ];
        await stateManager.appendEntries(entries);
        const lastIndex = await stateManager.getLastIndex();
        expect(lastIndex).toEqual(3);
      });
    });
  });

  describe("Volatile state", () => {
    describe("Initial values", () => {
      it("commitIndex should be initialized with '-1'", () => {
        const commitIndex = stateManager.getCommitIndex();
        expect(commitIndex).toEqual(-1);
      });

      it("lastApplied should be initialized with '-1'", () => {
        const lastApplied = stateManager.getLastApplied();
        expect(lastApplied).toEqual(-1);
      });
    });

    describe("Setters", () => {
      it("commitIndex should be updated correctly", () => {
        stateManager.setCommitIndex(10);
        const commitIndex = stateManager.getCommitIndex();
        expect(commitIndex).toEqual(10);
      });

      it("lastApplied should be updated correctly", () => {
        stateManager.setLastApplied(10);
        const lastApplied = stateManager.getLastApplied();
        expect(lastApplied).toEqual(10);
      });
    });
  });

  describe("Leader Volatile state", () => {
    describe("Initial values", () => {
      it("nextIndex should be initialized to zero", () => {
        const nextIndex = stateManager.getNextIndex("NODE1");
        expect(nextIndex).toEqual(0);
      });

      it("matchIndex should be initialized to '-1'", () => {
        const matchIndex = stateManager.getMatchIndex("NODE1");
        expect(matchIndex).toEqual(-1);
      });
    });

    describe("Setters", () => {
      it("nextIndex should be updated correctly", () => {
        stateManager.setNextIndex("NODE1", 1);
        const nextIndex = stateManager.getNextIndex("NODE1");
        expect(nextIndex).toEqual(1);
      });

      it("matchIndex should be updated correctly", () => {
        stateManager.setMatchIndex("NODE1", 0);
        const matchIndex = stateManager.getMatchIndex("NODE1");
        expect(matchIndex).toEqual(0);
      });

      it("Should be reset correctly", async () => {
        stateManager.setNextIndex("NODE1", 10);
        stateManager.setMatchIndex("NODE1", 9);
        await stateManager.reset();
        const matchIndex = stateManager.getMatchIndex("NODE1");
        const nextIndex = stateManager.getNextIndex("NODE1");
        expect(nextIndex).toEqual(0);
        expect(matchIndex).toEqual(-1);
      });
    });
  });
});
