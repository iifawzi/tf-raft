import { MemoryNetwork, MemoryServer } from "@/adapters/network/memory";
import { LocalStateManager } from "@/adapters/state";
import { RaftNode, STATES } from "@/core";
import { sleep } from "@/utils";
import { removeDir } from "./helpers/deleteDir.helper";
import { CommandType } from "@/interfaces";

describe("Store Operations", () => {
  console.log = jest.fn();

  describe("Communicating with node other than leader", () => {
    it("should reject the request and hint the leader", async () => {
      await removeDir("testdb/store1");
      const network = MemoryNetwork.getTestNetwork();
      // 1
      const server1 = new MemoryServer();
      network.addServer("NODE1", server1);
      const state1 = new LocalStateManager("NODE1", "testdb/cand1");
      const node1 = await RaftNode.create(
        "NODE1",
        server1,
        state1,
        "MEMORY",
        true
      );
      await sleep(300);
      // 2
      const server2 = new MemoryServer();
      network.addServer("NODE2", server2);
      const state2 = new LocalStateManager("NODE2", "testdb/cand1");
      const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
      server1.AddServer({ newServer: "NODE2" });

      // 3
      const server3 = new MemoryServer();
      network.addServer("NODE3", server3);
      const state3 = new LocalStateManager("NODE3", "testdb/cand1");
      const node3 = await RaftNode.create("NODE3", server3, state3, "MEMORY");
      server1.AddServer({ newServer: "NODE3" });

      await sleep(300);

      const requestResponse = await server2.ClientRequest({
        type: CommandType.STORE_SET,
        data: { key: "testing", value: "SHOULD_EQUAL1" },
      });
      expect(requestResponse.status).toEqual(false);
      expect(requestResponse.leaderHint).toEqual(node1.nodeId);
      await sleep(500);

      const queryResponse = server2.ClientQuery({ key: "testing" });
      expect(queryResponse.status).toEqual(false);
      expect(queryResponse.response).toEqual('');
      expect(queryResponse.leaderHint).toEqual(node1.nodeId);
      node1.stopListeners();
      node2.stopListeners();
      node3.stopListeners();
    });
  });

  describe("Communicating with the leader", () => {
    it("it should get the value that has been set correctly", async () => {
      await removeDir("testdb/store2");
      const network = MemoryNetwork.getTestNetwork();
      // 1
      const server1 = new MemoryServer();
      network.addServer("NODE1", server1);
      const state1 = new LocalStateManager("NODE1", "testdb/cand1");
      const node1 = await RaftNode.create(
        "NODE1",
        server1,
        state1,
        "MEMORY",
        true
      );
      await sleep(300);
      // 2
      const server2 = new MemoryServer();
      network.addServer("NODE2", server2);
      const state2 = new LocalStateManager("NODE2", "testdb/cand1");
      const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
      server1.AddServer({ newServer: "NODE2" });

      // 3
      const server3 = new MemoryServer();
      network.addServer("NODE3", server3);
      const state3 = new LocalStateManager("NODE3", "testdb/cand1");
      const node3 = await RaftNode.create("NODE3", server3, state3, "MEMORY");
      server1.AddServer({ newServer: "NODE3" });

      await sleep(300);

      await server1.ClientRequest({
        type: CommandType.STORE_SET,
        data: { key: "testing", value: "SHOULD_EQUAL1" },
      });

      await sleep(500);

      const queryResponse = server1.ClientQuery({ key: "testing" });
      expect(queryResponse.response).toEqual("SHOULD_EQUAL1");

      await server1.ClientRequest({
        type: CommandType.STORE_DEL,
        data: { key: "testing" },
      });

      await sleep(500);
      
      const queryResponse2 = server1.ClientQuery({ key: "testing" });
      expect(queryResponse2.response).toEqual(null);

      node1.stopListeners();
      node2.stopListeners();
      node3.stopListeners();
    });
  });
});
