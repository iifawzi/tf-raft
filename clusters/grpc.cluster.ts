import { gRPCServer } from "@/adapters/network/gRPC/grpc.server";
import { LocalStateManager } from "@/adapters/state";
import { RaftNode } from "@/core";
import { PeerFactory } from "@/factories";
import { PeerConnection } from "@/interfaces";

export class gRPCCluster {
  public connections: PeerConnection[] = [];
  public async start() {
    // 1
    const nodeIdentifier1 = "NODE1:50000";

    const identifierElements = nodeIdentifier1.split(":");
    const PORT = identifierElements[1] as unknown as number;
    const server1 = new gRPCServer(PORT);
    const leaderClient = PeerFactory("RPC", nodeIdentifier1);
    const state1 = new LocalStateManager(nodeIdentifier1);
    await RaftNode.create(
      nodeIdentifier1,
      server1,
      state1,
      "RPC",
      true
    );
    const node1Connection = PeerFactory("RPC", nodeIdentifier1);
    this.connections.push(node1Connection);

    setTimeout(async () => {
      // 2
      const nodeIdentifier2 = "NODE2:50001";
      const identifierElements2 = nodeIdentifier2.split(":");
      const PORT2 = identifierElements2[1] as unknown as number;
      const server2 = new gRPCServer(PORT2);
      const state2 = new LocalStateManager(nodeIdentifier2);
      await RaftNode.create(
        nodeIdentifier2,
        server2,
        state2,
        "RPC"
      );
      const node2Connection = PeerFactory("RPC", nodeIdentifier2);
      this.connections.push(node2Connection);
      leaderClient.addServer({ newServer: nodeIdentifier2 });

       // 3
       const nodeIdentifier3 = "NODE3:50002";
       const identifierElements3 = nodeIdentifier3.split(":");
       const PORT3 = identifierElements3[1] as unknown as number;
       const server3 = new gRPCServer(PORT3);
       const state3 = new LocalStateManager(nodeIdentifier3);
       await RaftNode.create(
         nodeIdentifier3,
         server3,
         state3,
         "RPC"
       );
       const node3Connection = PeerFactory("RPC", nodeIdentifier3);
       this.connections.push(node3Connection);
       leaderClient.addServer({ newServer: nodeIdentifier3 });
    }, 310);
  }
}
