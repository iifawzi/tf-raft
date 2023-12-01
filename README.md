# tf-raft: Distributed Key-Value Store for educational fun!

## About the Project

tf-raft is a <b>non-production-ready</b>, reliable, and fault-tolerant distributed key-value store based on the RAFT Consensus Protocol. It is designed for educational purposes, providing a hands-on experience with distributed systems.

The system supports three types of data stores: `HASH`, `SET`, and `STRING`.

## Raft Consensus Protocol

The implementation of tf-raft is based on the ["CONSENSUS: BRIDGING THEORY AND PRACTICE"](https://web.stanford.edu/~ouster/cgi-bin/papers/OngaroPhD.pdf) dissertation. Raft is a consensus protocol designed to be easy to understand. In essence, Raft ensures that a distributed system reaches a consensus on a single value even if some of the nodes in the system fail or behave maliciously.

In short, Raft achieves consensus through a leader-follower model, where one node serves as the leader and others as followers. The leader is responsible for coordinating the consensus process, and all updates go through the leader to ensure consistency.

tf-raft implements the three core components of the RAFT Consensus Protocol:

1. **Leader Election:** The process by which a leader is chosen among the nodes.
2. **Log Replication:** Ensuring that the logs across nodes are consistent through replication.
3. **Cluster Membership Changes:** Handling dynamic changes in the cluster, such as adding or removing nodes.

The core of tf-raft is fully isolated and independent from the infrastructure, relying on ports and adapters for high flexibility.
tf-raft currently supports `gRPC` and `In-Memory` adapters for the network layer & `In-Memory` and `JSON-Based` adapters for volatile and non-volatile states, respectively.

## Store Commands

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

## License

[MIT](LICENSE)

## Copyright

Copyright (c) 2023 Fawzi Abdulfattah
