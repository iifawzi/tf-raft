# tf-raft: Distributed key-value store for educational fun!

![Untitled-2023-12-02-0248](https://github.com/iifawzi/tf-raft/assets/46695441/118eb8d8-7796-4b02-8f4c-0fb82bca1af3)

## About the Project

tf-raft is a <b>non-production-ready</b> reliable, and fault-tolerant distributed key-value store based on the RAFT Consensus Protocol. It is designed for educational purposes, providing a hands-on experience with distributed systems.

The system supports three types of data stores: `HASH`, `SET`, and `STRING`.

#### tl;dr: why not production ready?

tf-raft is not production-ready due to some unimplemented features, such as leadership transfer, only-once semantics, and log compaction. However, log replication, leader elections, and membership changes are fully implemented, functional, and thoroughly tested. The project is shared openly to facilitate exploration and understanding of the RAFT Protocol within the TypeScript/JavaScript community, with potential future work to complete the missing features.

## Raft Consensus Protocol

The implementation of tf-raft is based on the [CONSENSUS: Bridging theory and practice](https://web.stanford.edu/~ouster/cgi-bin/papers/OngaroPhD.pdf) dissertation. Raft is a consensus protocol designed to be easy to understand. In essence, Raft ensures that a distributed system reaches a consensus on a single value even if some of the nodes in the system fail or behave maliciously.

In short, Raft achieves consensus through a leader-follower model, where one node serves as the leader and others as followers. The leader is responsible for coordinating the consensus process, and all updates go through the leader to ensure consistency.

tf-raft implements the three core components of the RAFT Consensus Protocol:

1. **Leader Election:** The process by which a leader is chosen among the nodes.
2. **Log Replication:** Ensuring that the logs across nodes are consistent through replication.
3. **Cluster Membership Changes (one member at a time):** Handling dynamic changes in the cluster, such as adding or removing nodes 

The core of tf-raft is fully isolated and independent from the infrastructure, relying on ports and adapters for high flexibility.
tf-raft currently supports `gRPC` and `In-Memory` adapters for the network layer & `In-Memory` and `JSON-Based` adapters for volatile and non-volatile states, respectively.

## Store Commands

![Dec-02-2023 03-19-42](https://github.com/iifawzi/tf-raft/assets/46695441/f929ca76-17b4-4186-8785-bd9536eb1cca)

Below are the commands supported by tf-raft, along with their descriptions and example usage:

| Command                                        | Description                                     | Example Usage                                         |
| ---------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| `SET KEY VALUE`                                | Set the value of a key                          | `SET my_key 42`                                       |
| `GET KEY`                                      | Retrieve the value of a key                     | `GET my_key`                                          |
| `DEL KEY`                                      | Delete a key and its associated value           | `DEL my_key`                                          |
| `HDEL hash_name key1 [key2 key3 ...]`          | Delete one or more fields from a hash           | `HDEL my_hash field1 field2`                          |
| `HSET hash_name key1:value1 [key2:value2 ...]` | Set multiple field values in a hash             | `HSET user_info username:john email:john@example.com` |
| `HGET hash_name key`                           | Get the value associated with a field in a hash | `HGET user_info username`                             |
| `SDEL set_name value1 [value2 value ...]`      | Remove one or more members from a set           | `SDEL my_set member1 member2`                         |
| `SHAS set_name value`                          | Check if a value is a member of a set           | `SHAS my_set member`                                  |
| `SSET set_name value1 [value2 ...]`            | Add one or more members to a set                | `SSET my_set value1 value2`                           |

Please note that tf-raft is not intended for production use and serves solely as an educational tool.

## Installation & Usage

### Install Dependencies

```bash
npm install
```

### Start the tf-raft Cluster

```bash
npm run start [memory, RPC] [number_of_nodes]
```

<ul>
  <li><strong>Optional Parameters:</strong></li>
  <ul>
    <li><code>memory</code> or <code>RPC</code>: Specify the protocol for network communication (default is <code>memory</code>).</li>
    <li><code>number_of_nodes</code>: Specify the number of nodes in the cluster (default is 3). The number must be 3 or larger.</li>
  </ul>
</ul>

After running the start command, a command-line prompt will be available to issue the commands mentioned above.

## Development areas

### How it Works?

The tf-raft implementation is organized into distinct folders to enhance clarity and maintainability. The core implementation resides in the Core folder, featuring the essential components of the RAFT consensus protocol. Additionally, network and persistence adapters are located in the adapters folder, while the logic governing the key-value store is encapsulated within the store folder.

tf-raft supports currently comes with two clusters, namely `MemoryCluster` and `gRPCCluster`, The `MemoryCluster` has a virtual network to facilitate communication among peers and nodes.

Within the context of tf-raft, the term "peers" refers to the clients of a node. Communication with any node is achieved through its associated peer. The concept of peers aligns with RAFT terminology, where, for a given node, all other nodes in the system are considered peers.

### How to create a node / Peer?

Let's say we want to create a node using the `Memory` Protocol, this can be achieved by firstly creating the adapters, `MemoryServer` and `LocalStateManager` then inject it into the RaftNode create method.


```ts
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

```

<ol>
  <li><strong>Node Identification:</strong>
    <ul>
      <li>const identifier = "NODE": Assigns a unique identifier to the node, crucial for distinguishing it within the cluster.</li>
    </ul>
  </li>
  <li><strong>Adapters Creation:</strong>
    <ul>
      <li>Create the necessary adapters, <code>MemoryServer</code> for network communication and <code>LocalStateManager</code> for local state management.</li>
    </ul>
  </li>
  <li><strong>Register Server in Network: (Only used for memory protocol) </strong>
    <ul>
      <li><code>network.addServer(identifier, server1);</code>: Registers the newly created server in the network with the assigned identifier.</li>
    </ul>
  </li>
  <li><strong>Local State Manager Setup:</strong>
    <ul>
      <li><code>const state1 = new LocalStateManager(identifier)</code>: Instantiates a <code>LocalStateManager</code> to manage the local state of the node, associated with the given identifier.</li>
    </ul>
  </li>
  <li><strong>Node Creation:</strong>
    <ul>
      <li><code>await RaftNode.create(identifier, server1, state1, "MEMORY", true)</code>: Invokes the <code>create</code> method of <code>RaftNode</code>, initializing a new node with the specified identifier, server, state manager, protocol ("MEMORY" in this case), and an optional parameter indicating whether the node should start as a leader (<code>true</code>).</li>
    </ul>
  </li>
  <li><strong>Leader Startup Considerations:</strong>
    <ul>
      <li>The last parameter (<code>true</code>) is crucial when a node is intended to be a leader. It helps distinguish nodes that initiate the random election timeout and transition to the <code>candidate</code> state from those waiting for a leader to communicate with them (steady state). This prevents unnecessary conversions of newly added followers to candidates while the leader is syncing with them.</li>
    </ul>
  </li>
</ol>

for the Peers creation, you can simply depend on the factory:

https://github.com/iifawzi/tf-raft/blob/96d8d738b5db0b22771fda7cd909c09735eb60c6/clusters/memory.cluster.ts#L30

https://github.com/iifawzi/tf-raft/blob/96d8d738b5db0b22771fda7cd909c09735eb60c6/factories/peer.factory.ts#L5-L18

### Testing

The foundational logic, coupled with the memory adapters, has undergone comprehensive testing using JEST, achieving near 99% test coverage.

To run the tests, execute the following command:
```bash
npm run test
```

Please note that due to the usage of json-db for persistent storage, occasional unexpected behavior may occur, leading to the temporary deletion and restoration of the entire stored data for seconds. This unpredictability might result in test failures.

For thorough testing, it is better to run the tests multiple times. If encountering errors such as "can't read term of undefined," it indicates a momentary disappearance of persisted data. Running the tests again should mitigate this issue.

### Useful References for implementation

besides the dissertation, it was super useful going through the discussions in the raft-dev group, many of the questions that mind come to your mind while implementing this, has been already discussed in the group. [Raft development Group](https://groups.google.com/g/raft-de)

bonus if you're arabic speaker: the distributed systems' list by Ahmed Fraghal [Distributed Systems in arabic](https://www.youtube.com/watch?v=s_p3I5CMGJw)
and actually it was the first time I hear about raft, in this series.

## License

[MIT](LICENSE)

## Copyright

Copyright (c) 2023 Fawzi Abdulfattah



