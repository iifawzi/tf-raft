import { gRPCServer } from "@/adapters/network/gRPC/grpc.server";
import { LocalStateManager } from "@/adapters/state";
import { RaftNode } from "@/core";
import { PeerFactory } from "@/factories";
import { PeerConnection } from "@/interfaces";

export class gRPCCluster {
  constructor(private nodesNumber: number) {
    this.nodesNumber = nodesNumber;
  }
  public connections: PeerConnection[] = [];
  public async start() {
    // 1
    const nodeIdentifier1 = "NODE:50000";

    const identifierElements = nodeIdentifier1.split(":");
    const PORT = identifierElements[1] as unknown as number;
    const server1 = new gRPCServer(PORT);
    const leaderClient = PeerFactory("RPC", nodeIdentifier1);
    const state1 = new LocalStateManager(nodeIdentifier1);
    await RaftNode.create(nodeIdentifier1, server1, state1, "RPC", true);
    const node1Connection = PeerFactory("RPC", nodeIdentifier1);
    this.connections.push(node1Connection);

    setTimeout(async () => {
      for (let i = 0; i < this.nodesNumber - 1; i++) {
        const nodeIdentifier = `NODE${i}:5500${i}`;
        const identifierElements = nodeIdentifier.split(":");
        const PORT = identifierElements[1] as unknown as number;
        const server = new gRPCServer(PORT);
        const state = new LocalStateManager(nodeIdentifier);
        await RaftNode.create(nodeIdentifier, server, state, "RPC");
        const nodeConnection = PeerFactory("RPC", nodeIdentifier);
        this.connections.push(nodeConnection);
        leaderClient.addServer({ newServer: nodeIdentifier });
      }
    }, 310);
  }
}
