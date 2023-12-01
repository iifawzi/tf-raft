import { MemoryServer } from "@/adapters/network/memory";
import { MemoryNetwork } from "@/adapters/network/memory/memory.network";
import { LocalStateManager } from "@/adapters/state";
import { RaftNode } from "@/core";
import { PeerFactory } from "@/factories";
import { PeerConnection, RaftCluster } from "@/interfaces";

export class MemoryCluster implements RaftCluster {
  constructor(private nodesNumber: number) {
    this.nodesNumber = nodesNumber;
  }

  public connections: PeerConnection[] = [];
  public async start() {
    const network = MemoryNetwork.getNetwork();

    // LEADER NODE
    const nodeIdentifier1 = "NODE";
    const server1 = new MemoryServer();
    network.addServer(nodeIdentifier1, server1);
    const state1 = new LocalStateManager(nodeIdentifier1);
    await RaftNode.create(
      nodeIdentifier1,
      server1,
      state1,
      "MEMORY",
      true
    );

    const node1Connection = PeerFactory("MEMORY", nodeIdentifier1);
    this.connections.push(node1Connection);
    setTimeout(async () => {
      for ( let i = 0; i < this.nodesNumber - 1; i++) {
        const nodeIdentifier = "NODE" + i;
        const server = new MemoryServer();
        network.addServer(nodeIdentifier, server);
        const state = new LocalStateManager(nodeIdentifier);
        await RaftNode.create(
          nodeIdentifier,
          server,
          state,
          "MEMORY"
        );
        const nodeConnection = PeerFactory("MEMORY", nodeIdentifier);
        this.connections.push(nodeConnection);
        server1.AddServer({ newServer: nodeIdentifier });
      }
    }, 310);
  }
}
