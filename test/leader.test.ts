import {
  MemoryNetwork,
  MemoryServer,
} from "@/adapters/network/memory";
import { LocalStateManager } from "@/adapters/state";
import { RaftNode, STATES } from "@/core";
import { sleep } from "@/utils";
import { removeDir } from "./helpers/deleteDir.helper";
import { CommandType } from "@/interfaces";

describe("Leaders", () => {
  console.log = jest.fn();

  describe("Leader appends no-op entry after becoming a leader", () => {
    it("no-op entry should be replicated to all nodes", async () => {
      await removeDir('testdb/led1')
      const network = MemoryNetwork.getTestNetwork();
      // 1
      const server1 = new MemoryServer();
      network.addServer("NODE1", server1);
      const state1 = new LocalStateManager("NODE1", "testDB/led1");
      const node1 = await RaftNode.create(
        "NODE1",
        server1,
        state1,
        "MEMORY",
        true
      );
      await sleep(300);
      // 2
      const server2 = new MemoryServer();
      network.addServer("NODE2", server2);
      const state2 = new LocalStateManager("NODE2", "testDB/led1");
      const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
      server1.AddServer({ newServer: "NODE2" });

      // 3
      const server3 = new MemoryServer();
      network.addServer("NODE3", server3);
      const state3 = new LocalStateManager("NODE3", "testDB/led1");
      const node3 = await RaftNode.create("NODE3", server3, state3, "MEMORY");
      server1.AddServer({ newServer: "NODE3" });

      await sleep(1000);

      const node1NOOPLog = await node1.nodeStore.getLogAtIndex(1);
      const node2NOOPLog = await node2.nodeStore.getLogAtIndex(1);
      const node3NOOPLog = await node3.nodeStore.getLogAtIndex(1);
      expect(node1NOOPLog.term).toEqual(0);
      expect(node1NOOPLog.command.data).toEqual("NODE1");
      expect(node2NOOPLog.term).toEqual(0);
      expect(node2NOOPLog.command.data).toEqual("NODE1");
      expect(node3NOOPLog.term).toEqual(0);
      expect(node3NOOPLog.command.data).toEqual("NODE1");

      node1.stopListeners();
      node2.stopListeners();
      node3.stopListeners();
    });
  });

  describe("Leader appends commands and replicate them", () => {
    it("command should be appended to leader and replicated to all nodes", async () => {
      await removeDir('testdb/led2')
      const network = MemoryNetwork.getTestNetwork();
      // 1
      const server1 = new MemoryServer();
      network.addServer("NODE1", server1);
      const state1 = new LocalStateManager("NODE1", "testDB/led2");
      const node1 = await RaftNode.create(
        "NODE1",
        server1,
        state1,
        "MEMORY",
        true
      );
      await sleep(1000);
      // 2
      const server2 = new MemoryServer();
      network.addServer("NODE2", server2);
      const state2 = new LocalStateManager("NODE2", "testDB/led2");
      const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
      server1.AddServer({ newServer: "NODE2" });

      // 3
      const server3 = new MemoryServer();
      network.addServer("NODE3", server3);
      const state3 = new LocalStateManager("NODE3", "testDB/led2");
      const node3 = await RaftNode.create("NODE3", server3, state3, "MEMORY");
      server1.AddServer({ newServer: "NODE3" });

      await sleep(300);

      await server1.ClientRequest({ type: CommandType.STORE_SET, data: { key: 'test', value: 'working' }});
      const leaderLastLog = await node1.nodeStore.getLastLogEntry();

      await sleep(300);

      const node1LastLog = await node1.nodeStore.getLastLogEntry();
      const node2LastLog = await node1.nodeStore.getLastLogEntry();

      expect(node1LastLog.term).toEqual(leaderLastLog.term);
      expect(node1LastLog.command).toEqual(leaderLastLog.command);
      expect(node2LastLog.term).toEqual(leaderLastLog.term);
      expect(node2LastLog.command).toEqual(leaderLastLog.command);

      node1.stopListeners();
      node2.stopListeners();
      node3.stopListeners();
    });
  });

  describe("Leader replicate logs and dynamically fix its nextIndex for other nodes", () => {
    it("nextIndex should be decreased if previous log entry doesn't exist and log should be replicated", async () => {
      await removeDir('testdb/led3')
      const network = MemoryNetwork.getTestNetwork();
      // 1
      const server1 = new MemoryServer();
      network.addServer("NODE1", server1);
      const state1 = new LocalStateManager("NODE1", "testDB/led3");
      const node1 = await RaftNode.create(
        "NODE1",
        server1,
        state1,
        "MEMORY",
        true
      );
      await sleep(300);
      // 2
      const server2 = new MemoryServer();
      network.addServer("NODE2", server2);
      const state2 = new LocalStateManager("NODE2", "testDB/led3");
      const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
      server1.AddServer({ newServer: "NODE2" });

      // 3
      const server3 = new MemoryServer();
      network.addServer("NODE3", server3);
      const state3 = new LocalStateManager("NODE3", "testDB/led3");
      const node3 = await RaftNode.create("NODE3", server3, state3, "MEMORY");
      server1.AddServer({ newServer: "NODE3" });

      await sleep(800);

      await node3.nodeStore.deleteFromIndexMovingForward(0);
      await node2.becomeCandidate();

      await sleep(800);

      const leaderLastLogIndex = await node2.nodeStore.getLastIndex();
      const leaderLastLog = await node2.nodeStore.getLastLogEntry();

      const node3LastLogIndex = await node3.nodeStore.getLastIndex();
      const node3LastLog = await node3.nodeStore.getLastLogEntry();

      expect(node3LastLogIndex).toEqual(leaderLastLogIndex);
      expect(node3LastLog.term).toEqual(leaderLastLog.term);
      expect(node3LastLog.command).toEqual(leaderLastLog.command);

      node1.stopListeners();
      node2.stopListeners();
      node3.stopListeners();
    });
  });

  describe("Leader's log should be replicated and follower conflicting logs should be removed", () => {
    it("follower conflicting logs should be removed", async () => {
      await removeDir('testdb/led4')
      const network = MemoryNetwork.getTestNetwork();
      // 1
      const server1 = new MemoryServer();
      network.addServer("NODE1", server1);
      const state1 = new LocalStateManager("NODE1", "testDB/led4");
      const node1 = await RaftNode.create(
        "NODE1",
        server1,
        state1,
        "MEMORY",
        true
      );
      await sleep(300);
      // 2
      const server2 = new MemoryServer();
      network.addServer("NODE2", server2);
      const state2 = new LocalStateManager("NODE2", "testDB/led4");
      const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
      server1.AddServer({ newServer: "NODE2" });

      // 3
      const server3 = new MemoryServer();
      network.addServer("NODE3", server3);
      const state3 = new LocalStateManager("NODE3", "testDB/led4");
      const node3 = await RaftNode.create("NODE3", server3, state3, "MEMORY");
      server1.AddServer({ newServer: "NODE3" });

      await sleep(500);

      await node3.nodeStore.deleteFromIndexMovingForward(2);
      await node2.becomeCandidate();

      await sleep(1000);

      const leaderLastLogIndex = await node2.nodeStore.getLastIndex();
      const leaderLastLog = await node2.nodeStore.getLastLogEntry();

      const node3LastLogIndex = await node3.nodeStore.getLastIndex();
      const node3LastLog = await node3.nodeStore.getLastLogEntry();

      expect(node3LastLogIndex).toEqual(leaderLastLogIndex);
      expect(node3LastLog.term).toEqual(leaderLastLog.term);
      expect(node3LastLog.command).toEqual(leaderLastLog.command);

      node1.stopListeners();
      node2.stopListeners();
      node3.stopListeners();
    });
  });

  describe("Commit index is updated after commit to quorum ", () => {
    it("Commit index is updated correctly", async () => {
      await removeDir('testdb/led5')
      const network = MemoryNetwork.getTestNetwork();
      // 1
      const server1 = new MemoryServer();
      network.addServer("NODE1", server1);
      const state1 = new LocalStateManager("NODE1", "testDB/led5");
      const node1 = await RaftNode.create(
        "NODE1",
        server1,
        state1,
        "MEMORY",
        true
      );
      await sleep(500);
      // 2
      const server2 = new MemoryServer();
      network.addServer("NODE2", server2);
      const state2 = new LocalStateManager("NODE2", "testDB/led5");
      const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
      server1.AddServer({ newServer: "NODE2" });

      // 3
      const server3 = new MemoryServer();
      network.addServer("NODE3", server3);
      const state3 = new LocalStateManager("NODE3", "testDB/led5");
      const node3 = await RaftNode.create("NODE3", server3, state3, "MEMORY");
      server1.AddServer({ newServer: "NODE3" });

      await sleep(1500);
      const leaderCommitIndex = node1.nodeStore.getCommitIndex();
      expect(leaderCommitIndex).toEqual(3);
      const node2CommitIndex = node3.nodeStore.getCommitIndex();
      expect(node2CommitIndex).toEqual(3);
      const node3CommitIndex = node3.nodeStore.getCommitIndex();
      expect(node3CommitIndex).toEqual(3);

      node1.stopListeners();
      node2.stopListeners();
      node3.stopListeners();
    });
  });

  describe("Match & next indexes are updated after appending entries ", () => {
    it("Match & next indexes are updated correctly", async () => {
      await removeDir('testdb/led6')
      const network = MemoryNetwork.getTestNetwork();
      // 1
      const server1 = new MemoryServer();
      network.addServer("NODE1", server1);
      const state1 = new LocalStateManager("NODE1", "testDB/led6");
      const node1 = await RaftNode.create(
        "NODE1",
        server1,
        state1,
        "MEMORY",
        true
      );
      await sleep(500);
      // 2
      const server2 = new MemoryServer();
      network.addServer("NODE2", server2);
      const state2 = new LocalStateManager("NODE2", "testDB/led6");
      const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
      server1.AddServer({ newServer: "NODE2" });

      // 3
      const server3 = new MemoryServer();
      network.addServer("NODE3", server3);
      const state3 = new LocalStateManager("NODE3", "testDB/led6");
      const node3 = await RaftNode.create("NODE3", server3, state3, "MEMORY");
      server1.AddServer({ newServer: "NODE3" });

      await sleep(1000);

      const nextIndexes = node1.nodeStore.getNextIndexes();
      const matchIndexes = node1.nodeStore.getMatchIndexes();
      expect(Object.keys(nextIndexes).length).toEqual(2);
      expect(Object.keys(matchIndexes).length).toEqual(2);
      for (let key in nextIndexes) {
        const nodeNextIndex = nextIndexes[key];
        const nodeMatchIndex = matchIndexes[key];
        // two membership and no-op of leader
        expect(nodeNextIndex).toEqual(4);
        expect(nodeMatchIndex).toEqual(3);
      }

      node1.stopListeners();
      node2.stopListeners();
      node3.stopListeners();
    });
  });

  describe("Step down if discovered peer with higher term", () => {
    it("should step down if discovered peer with higher term in append entry response", async () => {
      await removeDir('testdb/led7');
      const network = MemoryNetwork.getTestNetwork();
      // 1
      const server1 = new MemoryServer();
      network.addServer("NODE1", server1);
      const state1 = new LocalStateManager("NODE1", "testdb/led7");
      const node1 = await RaftNode.create(
        "NODE1",
        server1,
        state1,
        "MEMORY",
        true
      );
      await sleep(500);
      expect(node1.nodeState).toEqual(STATES.LEADER);

      // 2
      const server2 = new MemoryServer();
      network.addServer("NODE2", server2);
      const state2 = new LocalStateManager("NODE2", "testdb/led7");
      const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
      server1.AddServer({ newServer: "NODE2" });

      await sleep(500);

      node1.stopListeners();
      node2.stopListeners();
      
      await node2.nodeStore.setCurrentTerm(await node1.nodeStore.getCurrentTerm() + 10)
      
      node1.sendHeartbeats();
      await sleep(1000);
      expect(node1.nodeState).toEqual(STATES.FOLLOWER);
      node1.stopListeners();
      node2.stopListeners();
    });
  });
});
