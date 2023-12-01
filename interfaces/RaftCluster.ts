import { PeerConnection } from "./PeerConnection";

export interface RaftCluster {
    connections: PeerConnection[],
    start(): Promise<void>
}