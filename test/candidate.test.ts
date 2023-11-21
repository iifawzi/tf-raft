import {
  MemoryNetwork,
  MemoryServer,
} from "@/adapters/network/memory";
import { LocalStateManager } from "@/adapters/state";
import { RaftNode, STATES } from "@/core";
import { sleep } from "@/utils";

describe("Candidate", () => {
  console.log = jest.fn();

  describe("Only one leader is elected", () => {
    it("should have only one leader per term", async () => {
      const network = MemoryNetwork.getTestNetwork();
      // 1
      const server1 = new MemoryServer();
      network.addServer("NODE1", server1);
      const state1 = new LocalStateManager("NODE1", "testDB");
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
      const state2 = new LocalStateManager("NODE2", "testDB");
      const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
      node1.addServerHandler({ newServer: "NODE2" });

      // 3
      const server3 = new MemoryServer();
      network.addServer("NODE3", server3);
      const state3 = new LocalStateManager("NODE3", "testDB");
      const node3 = await RaftNode.create("NODE3", server3, state3, "MEMORY");
      node1.addServerHandler({ newServer: "NODE3" });

      await sleep(300);

      expect(node1.nodeState).toEqual(STATES.LEADER);
      expect(node2.nodeState).toEqual(STATES.FOLLOWER);
      expect(node3.nodeState).toEqual(STATES.FOLLOWER);

      node1.stopListeners();
      node2.stopListeners();
      node3.stopListeners();
    });
  });

  describe("When multiple candidates", () => {
    it("Only one node become leader eventually", async () => {
      const network = MemoryNetwork.getTestNetwork();
      // 1
      const server1 = new MemoryServer();
      network.addServer("NODE1", server1);
      const state1 = new LocalStateManager("NODE1", "testDB");
      const node1 = await RaftNode.create(
        "NODE1",
        server1,
        state1,
        "MEMORY",
        true
      );
      await sleep(300);
      expect(node1.nodeState).toEqual(STATES.LEADER);

      // 2
      const server2 = new MemoryServer();
      network.addServer("NODE2", server2);
      const state2 = new LocalStateManager("NODE2", "testDB");
      const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
      node1.addServerHandler({ newServer: "NODE2" });

      // 3
      const server3 = new MemoryServer();
      network.addServer("NODE3", server3);
      const state3 = new LocalStateManager("NODE3", "testDB");
      const node3 = await RaftNode.create("NODE3", server3, state3, "MEMORY");
      node1.addServerHandler({ newServer: "NODE3" });

      await sleep(500);
      const leaderLastLog = await node1.nodeStore.getLastLogEntry();
      const node2LastLog = await node1.nodeStore.getLastLogEntry();
      const node3LastLog = await node1.nodeStore.getLastLogEntry();

      expect(node2LastLog.term).toEqual(leaderLastLog.term);
      expect(node2LastLog.command).toEqual(leaderLastLog.command);
      expect(node3LastLog.term).toEqual(node3LastLog.term);
      expect(node3LastLog.command).toEqual(node3LastLog.command);

      node1.stopListeners();

      await sleep(500);

      const states = [node1.nodeState, node2.nodeState, node3.nodeState];

      let leaderFound = false;
      let multipleLeader = false;
      for (let i = 0; i < states.length; i++) {
        if (states[i] === STATES.LEADER) {
          if (!multipleLeader) {
            leaderFound = true;
          } else {
            multipleLeader = true;
            break;
          }
        }
      }

      expect(multipleLeader).toEqual(false);
      expect(leaderFound).toEqual(true);

      node1.stopListeners();
      node2.stopListeners();
      node3.stopListeners();
    });
  });

  describe("Step down if discovered peer with higher term", () => {
    it("should step down if discovered peer with higher term in request vote handler", async () => {
      const network = MemoryNetwork.getTestNetwork();
      // 1
      const server1 = new MemoryServer();
      network.addServer("NODE1", server1);
      const state1 = new LocalStateManager("NODE1", "testDB");
      const node1 = await RaftNode.create(
        "NODE1",
        server1,
        state1,
        "MEMORY",
        true
      );
      await sleep(300);
      expect(node1.nodeState).toEqual(STATES.LEADER);

      // 2
      const server2 = new MemoryServer();
      network.addServer("NODE2", server2);
      const state2 = new LocalStateManager("NODE2", "testDB");
      const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
      node1.addServerHandler({ newServer: "NODE2" });

      await sleep(500);
      const leaderLastLog = await node1.nodeStore.getLastLogEntry();
      const node2LastLog = await node2.nodeStore.getLastLogEntry();

      // LOGS ARE THE SAME, ANY NODE CAN BE LEADER NOW.
      expect(node2LastLog.term).toEqual(leaderLastLog.term);
      expect(node2LastLog.command).toEqual(leaderLastLog.command);

      // node2 will elect itself for the leadership, and node1 will step down.
      node1.stopListeners();

      // LEADER STEPS DOWN
      await sleep(1000);
      expect(node2.nodeState).toEqual(STATES.LEADER);
      expect(node1.nodeState).toEqual(STATES.FOLLOWER);

      // Validate that all nodes have the correct term and logs replicated
      const leaderLastLog2 = await node1.nodeStore.getLastLogEntry();
      const node2LastLog2 = await node2.nodeStore.getLastLogEntry();
      // LOGS ARE THE SAME, ANY NODE CAN BE LEADER NOW.
      expect(node2LastLog2.term).toEqual(leaderLastLog2.term);
      expect(node2LastLog2.command).toEqual(leaderLastLog2.command);

      node1.stopListeners();
      node2.stopListeners();
    });

    it("should step down if discovered peer with higher term in request vote response", async () => {
      const network = MemoryNetwork.getTestNetwork();
      // 1
      const server1 = new MemoryServer();
      network.addServer("NODE1", server1);
      const state1 = new LocalStateManager("NODE1", "testDB");
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
      const state2 = new LocalStateManager("NODE2", "testDB");
      const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
      node1.addServerHandler({ newServer: "NODE2" });

      // 3
      const server3 = new MemoryServer();
      network.addServer("NODE3", server3);
      const state3 = new LocalStateManager("NODE3", "testDB");
      const node3 = await RaftNode.create("NODE3", server3, state3, "MEMORY");
      node1.addServerHandler({ newServer: "NODE3" });

      await sleep(1000);

      expect(node1.nodeState).toEqual(STATES.LEADER);
      expect(node2.nodeState).toEqual(STATES.FOLLOWER);
      expect(node3.nodeState).toEqual(STATES.FOLLOWER);
      node1.stopListeners();

      await node1.nodeStore.setCurrentTerm(4);
      await node3.nodeStore.setCurrentTerm(4);

      // node 2 will receive responses with term higher than its term, will step down to follower.
      node2.becomeCandidate();
      await sleep(1000);

      expect(node2.nodeState).toEqual(STATES.FOLLOWER);
      node1.stopListeners();
      node2.stopListeners();
      node3.stopListeners();
    });
  });

  describe("Candidate with incomplete log", () => {
    it("Shouldn't be elected leader", async () => {
      const network = MemoryNetwork.getTestNetwork();
      // 1
      const server1 = new MemoryServer();
      network.addServer("NODE1", server1);
      const state1 = new LocalStateManager("NODE1", "testDB");
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
      const state2 = new LocalStateManager("NODE2", "testDB");
      const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
      node1.addServerHandler({ newServer: "NODE2" });
      await sleep(1000);
      
      node1.stopListeners();
      await node2.nodeStore.deleteFromIndexMovingForward(0);
      await node2.becomeCandidate();

      await sleep(1000);

      expect(node2.nodeState).toEqual(STATES.FOLLOWER);

      node1.stopListeners();
      node2.stopListeners();
    });
  });
});
