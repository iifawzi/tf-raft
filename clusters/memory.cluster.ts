import { MemoryServer } from "@/adapters/network/memory";
import { MemoryNetwork } from "@/adapters/network/memory/memory.network";
import { LocalStateManager } from "@/adapters/state";
import { RaftNode } from "@/core";
import { PeerFactory } from "@/factories";
import { PeerConnection } from "@/interfaces";

export class MemoryCluster {
  public connections: PeerConnection[] = [];
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
      "MEMORY",
      true
    );

    const node1Connection = PeerFactory("MEMORY", nodeIdentifier1);
    this.connections.push(node1Connection);
    setTimeout(async () => {
      // 2
      const nodeIdentifier2 = "NODE2";
      const server2 = new MemoryServer();
      network.addServer(nodeIdentifier2, server2);
      const state2 = new LocalStateManager(nodeIdentifier2);
      await RaftNode.create(
        nodeIdentifier2,
        server2,
        state2,
        "MEMORY"
      );
      const node2Connection = PeerFactory("MEMORY", nodeIdentifier2);
      this.connections.push(node2Connection);
      server1.AddServer({ newServer: "NODE2" });

      // 3
      const nodeIdentifier3 = "NODE3";
      const server3 = new MemoryServer();
      network.addServer(nodeIdentifier3, server3);
      const state3 = new LocalStateManager(nodeIdentifier3);
      await RaftNode.create(
        nodeIdentifier3,
        server3,
        state3,
        "MEMORY"
      );
      const node3Connection = PeerFactory("MEMORY", nodeIdentifier3);
      this.connections.push(node3Connection);
      server1.AddServer({ newServer: nodeIdentifier3 });

      // 4:
      const nodeIdentifier4 = "NODE4";
      const server4 = new MemoryServer();
      network.addServer(nodeIdentifier4, server4);
      const state4 = new LocalStateManager(nodeIdentifier4);
      await RaftNode.create(
        nodeIdentifier4,
        server4,
        state4,
        "MEMORY"
      );
      const node4Connection = PeerFactory("MEMORY", nodeIdentifier4);
      this.connections.push(node4Connection);
      server1.AddServer({ newServer: nodeIdentifier4 });

      // 5
      const nodeIdentifier5 = "NODE5";
      const server5 = new MemoryServer();
      network.addServer(nodeIdentifier5, server5);
      const state5 = new LocalStateManager(nodeIdentifier5);
      await RaftNode.create(
        nodeIdentifier5,
        server5,
        state5,
        "MEMORY"
      );
      const node5Connection = PeerFactory("MEMORY", nodeIdentifier5);
      this.connections.push(node5Connection);
      server1.AddServer({ newServer: nodeIdentifier5 });
    }, 310);
  }
}
