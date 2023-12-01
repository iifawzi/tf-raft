import { gRPCPeer } from "@/adapters/network/gRPC/grpc.peer";
import { MemoryPeer } from "@/adapters/network/memory";
import { PeerConnection } from "@/interfaces";

export function PeerFactory(
  protocol: "RPC" | "MEMORY",
  peerIdentifier: string
): PeerConnection {
  switch (protocol) {
    case "RPC":
      const identifierElements = peerIdentifier.split(":");
      const PORT = identifierElements[1] as unknown as number;
      return new gRPCPeer(peerIdentifier, PORT);
    case "MEMORY":
      return new MemoryPeer(peerIdentifier);
    default:
      throw new Error(`Peer Protocol ${protocol} is not supported`);
  }
}
