import { Connection } from "./Connection";

export interface Network {
  listen(listener: (nodeId: string, connection: Connection) => void): any;
  requestVotes(peers: [], callback: (votedFor: string) => void): void;
}
