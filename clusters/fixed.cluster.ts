import { MemoryPeer, MemoryServer } from "@/adapters/network/memory";
import { MemoryNetwork } from "@/adapters/network/memory/memory.network";
import { LocalStateManager } from "@/adapters/state";
import { RaftNode, STATES } from "@/core";

export class FixedCluster {
  private nodes: RaftNode[] = [];

  public async start() {
    const network = new MemoryNetwork();

    // 1
    const server1 = new MemoryServer();
    const state1 = new LocalStateManager("NODE1");
    await state1.startPersistentDB();
    const node1 = new RaftNode("NODE1", server1, state1);
    this.nodes.push(node1);
    const peer1 = new MemoryPeer("NODE1", network);

    // 2
      const server2 = new MemoryServer();
      const state2 = new LocalStateManager("NODE2");
      await state2.startPersistentDB();
      const node2 = new RaftNode("NODE2", server2, state2);
      this.nodes.push(node2);
      const peer2 = new MemoryPeer("NODE2", network);
  
      // 3
      const server3 = new MemoryServer();
      const state3 = new LocalStateManager("NODE3");
      await state3.startPersistentDB();
      const node3 = new RaftNode("NODE3", server3, state3);
      this.nodes.push(node3);
      const peer3 = new MemoryPeer("NODE3", network);
  
      // 4:
      const server4 = new MemoryServer();
      const state4 = new LocalStateManager("NODE4");
      await state4.startPersistentDB();
      const node4 = new RaftNode("NODE4", server4, state4);
      this.nodes.push(node4);
      const peer4 = new MemoryPeer("NODE4", network);
  
      // 5
      const server5 = new MemoryServer();
      const state5 = new LocalStateManager("NODE5");
      await state5.startPersistentDB();
      const node5 = new RaftNode("NODE5", server5, state5);
      this.nodes.push(node5);
      const peer5 = new MemoryPeer("NODE5", network);
  
      // peers config:
      node1.addPeers([peer2, peer3, peer4, peer5]);
      node2.addPeers([peer1, peer3, peer4, peer5]);
      node3.addPeers([peer1, peer2, peer4, peer5]);
      node4.addPeers([peer1, peer2, peer3, peer5]);
      node5.addPeers([peer1, peer2, peer3, peer4]);
      // network config:
      network.addServer("NODE1", server1);
      network.addServer("NODE2", server2);
      network.addServer("NODE3", server3);
      network.addServer("NODE4", server4);
      network.addServer("NODE5", server5);
  }

  public getLeader(): RaftNode {
    // leader discovery
    let leader = undefined;
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (node.state == STATES.LEADER) {
        leader = node;
        break;
      }
    }

    if (!leader) {
      console.log("NO LEADER HAS BEEN FOUND, RETRYING");
      return this.getLeader();
    }
    return leader;
  }
}
