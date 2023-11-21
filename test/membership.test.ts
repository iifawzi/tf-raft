import { MemoryNetwork, MemoryServer } from "@/adapters/network/memory";
import { LocalStateManager } from "@/adapters/state";
import { RaftNode, STATES } from "@/core";
import { sleep } from "@/utils";

describe("Membership & Nodes Configurations", () => {
  console.log = jest.fn();

  describe("Single node becomes leader", () => {
    it("single node should become leader and a configuration log should be created", async () => {
      const network = MemoryNetwork.getTestNetwork();
      const server1 = new MemoryServer();
      network.addServer("NODE1", server1);
      const state1 = new LocalStateManager("NODE1", "testDB");
      const node1 = await RaftNode.create("NODE1", server1, state1, "MEMORY", true);
      await sleep(500);
      const firstLog = await node1.nodeStore.getLogAtIndex(0);
      expect(node1.nodeState).toEqual(STATES.LEADER);
      expect(firstLog.term).toEqual(0);
      expect(firstLog.command.data).toEqual('NODE1');
      node1.stopListeners();
    });
  });

  describe("AddServer should add the node to the cluster and replicate the configuration log to all nodes", () => {
    it("Nodes should be added and the logs should be replicated", async () => {
      const network = MemoryNetwork.getTestNetwork();
      const server1 = new MemoryServer();
      network.addServer("NODE1", server1);
      const state1 = new LocalStateManager("NODE1", "testDB");
      const node1 = await RaftNode.create("NODE1", server1, state1, "MEMORY", true);

      await sleep(1000);

      const server2 = new MemoryServer();
      network.addServer("NODE2", server2);
      const state2 = new LocalStateManager("NODE2", "testDB");
      const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
      node1.addServerHandler({ newServer: "NODE2" });

      const server3 = new MemoryServer();
      network.addServer("NODE3", server3);
      const state3 = new LocalStateManager("NODE3", "testDB");
      const node3 = await RaftNode.create("NODE3", server3, state3, "MEMORY");
      node1.addServerHandler({ newServer: "NODE3" });

      await sleep(300);

      node1.addCommand("TEST_COMMAND");

      await sleep(300);

      const leaderTerm = await node1.nodeStore.getCurrentTerm();
      const node2Term = await node2.nodeStore.getCurrentTerm();
      const node3Term = await node3.nodeStore.getCurrentTerm();
      expect(node2Term).toEqual(leaderTerm);
      expect(node3Term).toEqual(leaderTerm);

      const leaderLastLog = await node1.nodeStore.getLastLogEntry();
      const node2LastLog = await node2.nodeStore.getLastLogEntry();
      const node3LastLog = await node3.nodeStore.getLastLogEntry();

      expect(node2LastLog.term).toEqual(leaderLastLog.term);
      expect(node2LastLog.command).toEqual(leaderLastLog.command);
      expect(node3LastLog.term).toEqual(node3LastLog.term);
      expect(node3LastLog.command).toEqual(node3LastLog.command);
      node1.stopListeners();
      node2.stopListeners();
      node3.stopListeners();
    });
  });

  //   it("Shouldn't be elected leader", (done) => {
  //     let originalLeader: string;
  //     let candidateId: string;
  //     setTimeout(async () => {
  //       for (let i = 0; i < nodes.length; i++) {
  //         const node = nodes[i];
  //         if (node.nodeState === STATES.LEADER) {
  //           expect(await node.nodeStore.getCurrentTerm()).toEqual(0);
  //           originalLeader = node.nodeId;
  //         }
  //       }
  //     }, 500);

  //     setTimeout(async () => {
  //       for (let i = 0; i < nodes.length; i++) {
  //         const node = nodes[i];
  //         if (node.nodeId !== originalLeader) {
  //           candidateId = node.nodeId;
  //           await node.nodeStore.deleteFromIndexMovingForward(0);
  //           await node.becomeCandidate();
  //           break;
  //         }
  //       }
  //     }, 1000);

  //     setTimeout(async () => {
  //       for (let i = 0; i < nodes.length; i++) {
  //         const node = nodes[i];
  //         if (node.nodeState === STATES.LEADER) {
  //           expect(node.nodeId !== candidateId).toEqual(true);
  //         }
  //       }

  //       done();
  //     }, 1120);
  //   });
  //   it("should step down if discovered peer with higher term in request vote response", (done) => {
  //     let originalLeader: string;
  //     setTimeout(async () => {
  //       for (let i = 0; i < nodes.length; i++) {
  //         const node = nodes[i];
  //         if (node.nodeState === STATES.LEADER) {
  //           expect(await node.nodeStore.getCurrentTerm()).toEqual(0);
  //           originalLeader = node.nodeId;
  //         }
  //       }
  //     }, 500);

  //     setTimeout(async () => {
  //       for (let i = 0; i < nodes.length; i++) {
  //         const node = nodes[i];
  //         if (node.nodeId !== originalLeader) {
  //           for (let j = 0; j < nodes.length; j++) {
  //             if (nodes[j].nodeId == originalLeader) {
  //               jest
  //                 .spyOn(nodes[j], "requestVoteHandler")
  //                 .mockResolvedValue({ term: 10, voteGranted: false });
  //             }
  //           }
  //           await node.becomeCandidate();
  //           break;
  //         }
  //       }
  //     }, 810);

  //     setTimeout(async () => {
  //       for (let i = 0; i < nodes.length; i++) {
  //         const node = nodes[i];
  //         expect(await node.nodeStore.getCurrentTerm()).toBeGreaterThanOrEqual(
  //           10
  //         );
  //       }

  //       done();
  //     }, 1500);
  //   });
  // });
});
