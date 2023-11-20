// the goal is just to test the communication layer.
import {
  MemoryNetwork,
  MemoryPeer,
  MemoryServer,
} from "@/adapters/network/memory";
import { LocalStateManager } from "@/adapters/state";
import { RaftNode, STATES } from "@/core";
import { LogEntry, PeerConnection } from "@/interfaces";

describe("Leaders", () => {
  console.log = jest.fn();
  let nodes: RaftNode[] = [];
  let peers: PeerConnection[] = [];
  let network: MemoryNetwork;
  beforeEach(async () => {
    nodes = [];
    peers = [];
    network = new MemoryNetwork();
    // 1
    const server1 = new MemoryServer();
    const state1 = new LocalStateManager("NODE1", "testDB");
    const node1 = await RaftNode.create("NODE1", server1, state1);
    nodes.push(node1);
    const peer1 = new MemoryPeer("NODE1", network);
    peers.push(peer1);

    // 2
    const server2 = new MemoryServer();
    const state2 = new LocalStateManager("NODE2", "testDB");
    const node2 = await RaftNode.create("NODE2", server2, state2);
    nodes.push(node2);
    const peer2 = new MemoryPeer("NODE2", network);
    peers.push(peer2);

    // 3
    const server3 = new MemoryServer();
    const state3 = new LocalStateManager("NODE3", "testDB");
    const node3 = await RaftNode.create("NODE3", server3, state3);
    nodes.push(node3);
    const peer3 = new MemoryPeer("NODE3", network);
    peers.push(peer3);

    // peers config:
    node1.addPeers([peer2, peer3]);
    node2.addPeers([peer1, peer3]);
    node3.addPeers([peer1, peer2]);
    // network config:
    network.addServer("NODE1", server1);
    network.addServer("NODE2", server2);
    network.addServer("NODE3", server3);
  });

  afterEach(() => {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      node.stopListeners();
    }
  });

  describe("Only one leader is elected", () => {
    it("should have only one leader per term", (done) => {
      let leader: string;
      setTimeout(async () => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeState === STATES.LEADER) {
            leader = node.nodeId;
            break;
          }
        }
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeId !== leader) {
            expect(node.nodeState).toEqual(STATES.FOLLOWER);
          }
        }
        done();
      }, 1000);
    });

    describe("Multiple candidates", () => {
      it("Only one node become leader eventually", (done) => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeState === STATES.FOLLOWER) {
            node.becomeCandidate();
          }
        }
        let leaderFound = false;
        let multipleLeaders = false;
        setTimeout(async () => {
          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.nodeState === STATES.LEADER) {
              if (leaderFound) {
                multipleLeaders = true;
                break;
              } else {
                leaderFound = true;
              }
            }
          }
          expect(multipleLeaders).toEqual(false);
          done();
        }, 1500);
      });
    });
  });

  describe("Step down if discovered peer with higher term", () => {
    it("should step down if discovered peer with higher term in request vote handler", (done) => {
      let originalLeader: string;

      setTimeout(async () => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeState === STATES.LEADER) {
            expect(await node.nodeStore.getCurrentTerm()).toEqual(0);
            originalLeader = node.nodeId;
          }
        }
      }, 500);

      setTimeout(async () => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeId !== originalLeader) {
            await node.becomeCandidate();
            break;
          }
        }
      }, 810);

      setTimeout(async () => {
        let lastEntry!: LogEntry;
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeId === originalLeader) {
            expect(await node.nodeStore.getCurrentTerm()).toEqual(1);
            expect(node.nodeState).toEqual(STATES.FOLLOWER);
          }

          if (node.nodeState == STATES.LEADER) {
            const lastLog = await node.nodeStore.getLastLogEntry();
            lastEntry = lastLog;
          }
        }

        // Validate that all nodes have the correct term and logs replicated
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          expect(await node.nodeStore.getCurrentTerm()).toEqual(1);
          expect((await node.nodeStore.getLastLogEntry()).term).toEqual(
            lastEntry.term
          );
          expect((await node.nodeStore.getLastLogEntry()).command).toEqual(
            lastEntry.command
          );
        }

        done();
      }, 1120);
    });
    it("should step down if discovered peer with higher term in request vote response", (done) => {
      let originalLeader: string;
      setTimeout(async () => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeState === STATES.LEADER) {
            expect(await node.nodeStore.getCurrentTerm()).toEqual(0);
            originalLeader = node.nodeId;
          }
        }
      }, 500);

      setTimeout(async () => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeId !== originalLeader) {
            for (let j = 0; j < nodes.length; j++) {
              if (nodes[j].nodeId == originalLeader) {
                jest
                  .spyOn(nodes[j], "requestVoteHandler")
                  .mockResolvedValue({ term: 10, voteGranted: false });
              }
            }
            await node.becomeCandidate();
            break;
          }
        }
      }, 810);

      setTimeout(async () => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          expect(await node.nodeStore.getCurrentTerm()).toBeGreaterThanOrEqual(
            10
          );
        }

        done();
      }, 1500);
    });
  });

  describe("Candidate with incomplete log", () => {
    it("Shouldn't be elected leader", (done) => {
      let originalLeader: string;
      let candidateId: string;
      setTimeout(async () => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeState === STATES.LEADER) {
            expect(await node.nodeStore.getCurrentTerm()).toEqual(0);
            originalLeader = node.nodeId;
          }
        }
      }, 500);

      setTimeout(async () => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeId !== originalLeader) {
            candidateId = node.nodeId;
            await node.nodeStore.deleteFromIndexMovingForward(0);
            await node.becomeCandidate();
            break;
          }
        }
      }, 1000);

      setTimeout(async () => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeState === STATES.LEADER) {
            expect(node.nodeId !== candidateId).toEqual(true);
          }
        }

        done();
      }, 1120);
    });
    it("should step down if discovered peer with higher term in request vote response", (done) => {
      let originalLeader: string;
      setTimeout(async () => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeState === STATES.LEADER) {
            expect(await node.nodeStore.getCurrentTerm()).toEqual(0);
            originalLeader = node.nodeId;
          }
        }
      }, 500);

      setTimeout(async () => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeId !== originalLeader) {
            for (let j = 0; j < nodes.length; j++) {
              if (nodes[j].nodeId == originalLeader) {
                jest
                  .spyOn(nodes[j], "requestVoteHandler")
                  .mockResolvedValue({ term: 10, voteGranted: false });
              }
            }
            await node.becomeCandidate();
            break;
          }
        }
      }, 810);

      setTimeout(async () => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          expect(await node.nodeStore.getCurrentTerm()).toBeGreaterThanOrEqual(
            10
          );
        }

        done();
      }, 1500);
    });
  });
});
