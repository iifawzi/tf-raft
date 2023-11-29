import "module-alias/register";
import { FixedCluster } from "./clusters/memory.cluster";
import readline from "readline";
import { CommandType } from "./interfaces";
import { sleep } from "./utils";

const cluster = new FixedCluster();

(async () => {
  console.log = () => {};
  cluster.start();
  await sleep(1000);
  let leader = cluster.nodes[0]

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
        const setResponse = await leader.handleClientRequest({
          type: CommandType.STORE_SET,
          data: {
            key: args[1].toLowerCase(),
            value: args[2],
          },
        });
        if (setResponse.leaderHint) {
          leader = cluster.nodes.filter(node => node.nodeId == response.leaderHint)[0];
        }
        break;

      case "DEL":
        if (args.length !== 2) {
          console.info("Error: DELETE command requires a key argument.");
          break;
        }
        const response = await leader.handleClientRequest({
          type: CommandType.STORE_DEL,
          data: {
            key: args[1].toLowerCase(),
          },
        });
        if (response.leaderHint) {
          leader = cluster.nodes.filter(node => node.nodeId == response.leaderHint)[0];
        }
        break;

      case "GET":
        if (args.length !== 2) {
          console.info("Error: GET command requires a key argument.");
          break;
        }
        const queryResponse = leader.handleClientQuery(args[1].toLowerCase());
        if (queryResponse.leaderHint) {
          leader = cluster.nodes.filter(node => node.nodeId == response.leaderHint)[0];
        } else {
          console.info(queryResponse.response);
        }
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
    rl.prompt();
  });

  console.info(
    "TF-RAFT: Distributed KV Store for educational fun!"
  );
  console.info(
    "Enter your commands (e.g., SET key value, DEL key, GET key). Type EXIT to end."
  );
  rl.prompt();
})();
