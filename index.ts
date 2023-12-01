import "module-alias/register";
import readline from "readline";
import { CommandType, RaftCluster } from "./interfaces";
import { sleep } from "./utils";
import { gRPCCluster } from "./clusters/grpc.cluster";
import { MemoryCluster } from "./clusters/memory.cluster";

let cluster: RaftCluster;

(async () => {
  // it's used for debugging only, if enabled, the prompt will be messed up. 
  // because of the raft logs.
  console.log = () => {};
  
  const args = process.argv;
  const protocol = args[2] ?? 'memory';
  const nodesNumber = args[3] ?? 3;

  if (protocol !== 'memory' && protocol !== 'rpc') {
    throw new Error(`ONLY MEMORY & RPC Protocols are supported, you inserted ${protocol}`,);
  }

  if (Number(nodesNumber) < 3) {
    throw new Error(`The minimum number of nodes is 3, you inserted ${nodesNumber}`);
  }

  if (protocol == 'memory') {
    cluster = new MemoryCluster(Number(nodesNumber));
  } else {
    cluster = new gRPCCluster(Number(nodesNumber));
  }
  
  await cluster.start();
  await sleep(1000);
  let leader = cluster.connections[0];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  async function processCommand(command: string) {
    const args = command.split(" ");
    const commandType = args[0].toUpperCase();

    switch (commandType) {
      case "SET":
        if (args.length !== 3) {
          console.info("Error: SET command requires key and value arguments.");
          break;
        }
        const setResponse = await leader.clientRequest({
          type: CommandType.STORE_SET,
          data: {
            key: args[1].toLowerCase(),
            value: args[2],
          },
        });
        if (setResponse.leaderHint) {
          leader = cluster.connections.filter(
            (connection) => connection.peerId == setResponse.leaderHint
          )[0];
          processCommand(command);
        }
        rl.prompt();
        break;

      case "DEL":
        if (args.length !== 2) {
          console.info("Error: DELETE command requires a key argument.");
          break;
        }
        const response = await leader.clientRequest({
          type: CommandType.STORE_DEL,
          data: {
            key: args[1].toLowerCase(),
          },
        });
        if (response.leaderHint) {
          leader = cluster.connections.filter(
            (connection) => connection.peerId == response.leaderHint
          )[0];
          processCommand(command);
        }
        rl.prompt();
        break;

      case "GET":
        if (args.length !== 2) {
          console.info("Error: GET command requires a key argument.");
          break;
        }
        const queryResponse = await leader.clientQuery(args[1].toLowerCase());
        if (queryResponse.leaderHint) {
          leader = cluster.connections.filter(
            (connection) => connection.peerId == queryResponse.leaderHint
          )[0];
          processCommand(command);
        } else {
         console.info(queryResponse.response == '' ? null : queryResponse.response);
        }
        rl.prompt();
        break;

      case "EXIT":
        rl.close();
        process.exit(0);

      default:
        console.info(`Error: Invalid command type - ${commandType}`);
        break;
    }
  }

  rl.on("line", async (input) => {
    processCommand(input);
  });

  console.info("TF-RAFT: Distributed KV Store for educational fun!");
  console.info(
    "Enter your commands (e.g., SET key value, DEL key, GET key). Type EXIT to end."
  );
  rl.prompt();
})();
