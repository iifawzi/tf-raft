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
