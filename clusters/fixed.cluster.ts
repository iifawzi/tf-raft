import { MemoryServer } from "@/adapters/network/memory";
import { MemoryNetwork } from "@/adapters/network/memory/memory.network";
import { LocalStateManager } from "@/adapters/state";
import { RaftNode, STATES } from "@/core";

export class FixedCluster {
  private nodes: RaftNode[] = [];

  public async start() {
    const network = MemoryNetwork.getNetwork();

    // 1
    const nodeIdentifier1 = "NODE1";
    const server1 = new MemoryServer();
    network.addServer(nodeIdentifier1, server1);
    const state1 = new LocalStateManager(nodeIdentifier1);
    const node1 = await RaftNode.create(
      nodeIdentifier1,
      server1,
      state1,
      "MEMORY"
    );
    this.nodes.push(node1);

    setTimeout(async () => {
      // 2
      const nodeIdentifier2 = "NODE2";
      const server2 = new MemoryServer();
      network.addServer(nodeIdentifier2, server2);
      const state2 = new LocalStateManager(nodeIdentifier2);
      const node2 = await RaftNode.create(
        nodeIdentifier2,
        server2,
        state2,
        "MEMORY"
      );
      this.nodes.push(node2);
      node1.addServerHandler({ newServer: "NODE2" });

      // 3
      const nodeIdentifier3 = "NODE3";
      const server3 = new MemoryServer();
      network.addServer(nodeIdentifier3, server3);
      const state3 = new LocalStateManager(nodeIdentifier3);
      const node3 = await RaftNode.create(
        nodeIdentifier3,
        server3,
        state3,
        "MEMORY"
      );
      this.nodes.push(node3);
      node1.addServerHandler({ newServer: nodeIdentifier3 });

      // 4:
      const nodeIdentifier4 = "NODE4";
      const server4 = new MemoryServer();
      network.addServer(nodeIdentifier4, server4);
      const state4 = new LocalStateManager(nodeIdentifier4);
      const node4 = await RaftNode.create(
        nodeIdentifier4,
        server4,
        state4,
        "MEMORY"
      );
      this.nodes.push(node4);
      node1.addServerHandler({ newServer: nodeIdentifier4 });

      // 5
      const nodeIdentifier5 = "NODE5";
      const server5 = new MemoryServer();
      network.addServer(nodeIdentifier5, server5);
      const state5 = new LocalStateManager(nodeIdentifier5);
      const node5 = await RaftNode.create(
        nodeIdentifier5,
        server5,
        state5,
        "MEMORY"
      );
      this.nodes.push(node5);
      node1.addServerHandler({ newServer: nodeIdentifier5 });
    }, 310);
  }

  public getLeader(): RaftNode {
    // leader discovery
    let leader = undefined;
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (node.nodeState == STATES.LEADER) {
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
