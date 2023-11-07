import { Connection, Network } from "@/interfaces";

export class RaftNode {
  constructor(
    private readonly id: string,
    private readonly port: number,
    private readonly network: Network,
  ) {
    this.id = id;
    this.port = port;
    this.network = network;
    this.network.listen(this.port, this.listener.bind(this));
  }

  private listener(NodeId: string, connection: Connection): void {
    // TODO:: to be implemented.
  }

  get nodeId() {
    return this.id;
  }
}
