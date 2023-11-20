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

  describe("Leader appends no-op entry after becoming a leader", () => {
    it("no-op entry should be replicated to all nodes", (done) => {
      let logEntry: LogEntry;
      setTimeout(async () => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeState === STATES.LEADER) {
            const lastLog = await node.nodeStore.getLastLogEntry();
            expect(lastLog.command).toEqual(`no-op-${node.nodeId}`);
            logEntry = lastLog;
            break;
          }
        }
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const lastLog = await node.nodeStore.getLastLogEntry();
          expect(lastLog.term).toEqual(logEntry.term);
          expect(lastLog.command).toEqual(logEntry.command);
          break;
        }
        done();
      }, 1000);
    });
  });

  describe("Leader appends commands and replicate them", () => {
    it("command should be appended to leader and replicated to all nodes", (done) => {
      let logEntry: LogEntry;
      const command = "COMMAND-TEST";
      setTimeout(async () => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeState === STATES.LEADER) {
            await node.addCommand(command);
            const lastLog = await node.nodeStore.getLastLogEntry();
            expect(lastLog.command).toEqual(command);
            logEntry = lastLog;
            break;
          }
        }
      }, 300);
      setTimeout(async () => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const lastLog = await node.nodeStore.getLastLogEntry();
          expect(lastLog.term).toEqual(logEntry.term);
          expect(lastLog.command).toEqual(logEntry.command);
          break;
        }
        done();
      }, 800);
    });
  });

  describe("Leader replicate logs and dynamically fix its nextIndex for other nodes", () => {
    it("nextIndex should be decreased if previous log entry doesn't exist and log should be replicated", (done) => {
      let leaderId: string;
      let thirdNodeId: string;
      setTimeout(async () => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeState === STATES.LEADER) {
            leaderId = node.nodeId;
            await node.nodeStore.appendEntries([
              { term: 0, command: "TEST" },
              { term: 0, command: "TEST2" },
            ]);
            break;
          }
        }
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeId !== leaderId) {
            for (let j = 0; j < nodes.length; j++) {
              const thirdNode = nodes[j];
              if (
                thirdNode.nodeId !== leaderId &&
                thirdNode.nodeId !== node.nodeId
              ) {
                // reset this third node as if it's new, so when second node becomes leader, we test the consistency checks
                thirdNodeId = thirdNode.nodeId;
                await thirdNode.nodeStore.deleteFromIndexMovingForward(0);
              }
            }
            await node.becomeCandidate();
          }
        }
        done();
      }, 1000);

      setTimeout(async () => {
        let leaderLastLogIndex;
        let leaderLastLog;
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeState == STATES.LEADER) {
            leaderLastLogIndex = await node.nodeStore.getLastIndex();
            leaderLastLog = await node.nodeStore.getLastLogEntry();
          }
        }
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeId == thirdNodeId) {
            const log = await node.nodeStore.getLastLogEntry();
            const lastIndex = await node.nodeStore.getLastIndex();
            expect(log.command).toEqual(leaderLastLog?.command);
            expect(log.term).toEqual(leaderLastLog?.term);
            expect(lastIndex).toEqual(leaderLastLogIndex);
          }
        }
      });
    });
  });

  describe("Leader's log should be replicated and follower conflicting logs should be removed", () => {
    it("follower conflicting logs should be removed", (done) => {
      let leaderId: string;
      let thirdNodeId: string;
      setTimeout(async () => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeState === STATES.LEADER) {
            leaderId = node.nodeId;
            await node.nodeStore.appendEntries([
              { term: 0, command: "TEST" },
              { term: 0, command: "TEST2" },
            ]);
            break;
          }
        }
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeId !== leaderId) {
            for (let j = 0; j < nodes.length; j++) {
              const thirdNode = nodes[j];
              if (
                thirdNode.nodeId !== leaderId &&
                thirdNode.nodeId !== node.nodeId
              ) {
                // reset this third node as if it's new, so when second node becomes leader, we test the consistency checks
                thirdNodeId = thirdNode.nodeId;
                // Ch.3 P21 - Consistency checks failed.
                await thirdNode.nodeStore.deleteFromIndexMovingForward(2);
              }
            }
            await node.becomeCandidate();
          }
        }
        done();
      }, 1000);

      setTimeout(async () => {
        let leaderLastLogIndex;
        let leaderLastLog;
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeState == STATES.LEADER) {
            leaderLastLogIndex = await node.nodeStore.getLastIndex();
            leaderLastLog = await node.nodeStore.getLastLogEntry();
          }
        }
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeId == thirdNodeId) {
            const log = await node.nodeStore.getLastLogEntry();
            const lastIndex = await node.nodeStore.getLastIndex();
            expect(log.command).toEqual(leaderLastLog?.command);
            expect(log.term).toEqual(leaderLastLog?.term);
            expect(lastIndex).toEqual(leaderLastLogIndex);
          }
        }
      });
    });
  });

  describe("Commit index is updated after commit to quorum ", () => {
    it("Commit index is updated correctly", (done) => {
      setTimeout(async () => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const commitIndex = node.nodeStore.getCommitIndex();
          expect(commitIndex).toEqual(0);
        }
        done();
      }, 1000);
    });
  });

  describe("Match & next indexes are updated after appending entries ", () => {
    it("Match & next indexes are updated correctly", (done) => {
      setTimeout(async () => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.nodeState == STATES.LEADER) {
            const nextIndexes = node.nodeStore.getNextIndexes();
            const matchIndexes = node.nodeStore.getMatchIndexes();
            expect(Object.keys(nextIndexes).length).toEqual(2);
            expect(Object.keys(matchIndexes).length).toEqual(2);
            for (let key in nextIndexes) {
              const nodeNextIndex = nextIndexes[key];
              const nodeMatchIndex = matchIndexes[key];
              expect(nodeNextIndex).toEqual(1);
              expect(nodeMatchIndex).toEqual(0);
            }
          }
        }
        done();
      }, 1000);
    });
  });
});
