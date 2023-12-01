import { MemoryNetwork, MemoryServer } from "@/adapters/network/memory";
import { LocalStateManager } from "@/adapters/state";
import { RaftNode } from "@/core";
import { sleep } from "@/utils";
import { removeAndCreateDir } from "./helpers/deleteDir.helper";
import { CommandType, QueryType } from "@/interfaces";

describe("Store Operations", () => {
  console.log = jest.fn();

  describe("Communicating with node other than leader", () => {
    it("should reject the request and hint the leader", async () => {
      await removeAndCreateDir("testDB/store1");
      const network = MemoryNetwork.getTestNetwork();
      // 1
      const server1 = new MemoryServer();
      network.addServer("NODE1", server1);
      const state1 = new LocalStateManager("NODE1", "testDB/store1");
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
      const state2 = new LocalStateManager("NODE2", "testDB/store1");
      const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
      server1.AddServer({ newServer: "NODE2" });

      // 3
      const server3 = new MemoryServer();
      network.addServer("NODE3", server3);
      const state3 = new LocalStateManager("NODE3", "testDB/store1");
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

      const queryResponse = server2.ClientQuery({
        type: QueryType.GET,
        data: { key: "testing" },
      });
      expect(queryResponse.status).toEqual(false);
      expect(queryResponse.response).toEqual("");
      expect(queryResponse.leaderHint).toEqual(node1.nodeId);
      node1.stopListeners();
      node2.stopListeners();
      node3.stopListeners();
    });
  });

  describe("Communicating with the leader", () => {
    describe("STRING STORE", () => {
      it("it should get the value that has been set correctly", async () => {
        await removeAndCreateDir("testDB/store2");
        const network = MemoryNetwork.getTestNetwork();
        // 1
        const server1 = new MemoryServer();
        network.addServer("NODE1", server1);
        const state1 = new LocalStateManager("NODE1", "testDB/store2");
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
        const state2 = new LocalStateManager("NODE2", "testDB/store2");
        const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
        server1.AddServer({ newServer: "NODE2" });
        // 3
        const server3 = new MemoryServer();
        network.addServer("NODE3", server3);
        const state3 = new LocalStateManager("NODE3", "testDB/store2");
        const node3 = await RaftNode.create("NODE3", server3, state3, "MEMORY");
        server1.AddServer({ newServer: "NODE3" });

        await sleep(300);

        await server1.ClientRequest({
          type: CommandType.STORE_SET,
          data: { key: "testing", value: "SHOULD_EQUAL1" },
        });

        await sleep(500);

        const queryResponse = server1.ClientQuery({
          type: QueryType.GET,
          data: { key: "testing" },
        });
        expect(queryResponse.response).toEqual("SHOULD_EQUAL1");

        await server1.ClientRequest({
          type: CommandType.STORE_DEL,
          data: { key: "testing" },
        });

        await sleep(500);

        const queryResponse2 = server1.ClientQuery({
          type: QueryType.GET,
          data: { key: "testing" },
        });
        expect(queryResponse2.response).toEqual("");

        node1.stopListeners();
        node2.stopListeners();
        node3.stopListeners();
      });
    });

    describe("HASH STORE", () => {
      it("it should get the value that has been set correctly", async () => {
        await removeAndCreateDir("testDB/store2");
        const network = MemoryNetwork.getTestNetwork();
        // 1
        const server1 = new MemoryServer();
        network.addServer("NODE1", server1);
        const state1 = new LocalStateManager("NODE1", "testDB/store3");
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
        const state2 = new LocalStateManager("NODE2", "testDB/store3");
        const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
        server1.AddServer({ newServer: "NODE2" });

        // 3
        const server3 = new MemoryServer();
        network.addServer("NODE3", server3);
        const state3 = new LocalStateManager("NODE3", "testDB/store3");
        const node3 = await RaftNode.create("NODE3", server3, state3, "MEMORY");
        server1.AddServer({ newServer: "NODE3" });

        await sleep(300);

        await server1.ClientRequest({
          type: CommandType.STORE_HSET,
          data: { hashKey: "hash", pairs: ["key1:value1", "key2:value2"]},
        });

        await sleep(500);

        const queryResponse = server1.ClientQuery({
          type: QueryType.HGET,
          data: { hashKey: "hash", key: "key1" },
        });
        const queryResponse2 = server1.ClientQuery({
          type: QueryType.HGET,
          data: { hashKey: "hash", key: "key2" },
        });
        expect(queryResponse.response).toEqual("value1");
        expect(queryResponse2.response).toEqual("value2");

        await server1.ClientRequest({
          type: CommandType.STORE_HDEL,
          data: { hashKey: "hash", keys: ["key1", "key2"] },
        });

        await sleep(500);

        const queryResponse3 = server1.ClientQuery({
          type: QueryType.HGET,
          data: { hashKey: "hash", key: "key2" },
        });
        const queryResponse4 = server1.ClientQuery({
          type: QueryType.HGET,
          data: { hashKey: "hash", key: "key1" },
        });
        expect(queryResponse3.response).toEqual("");
        expect(queryResponse4.response).toEqual("");

        node1.stopListeners();
        node2.stopListeners();
        node3.stopListeners();
      });
    });

    describe("SET STORE", () => {
      it("it should get the value that has been set correctly", async () => {
        await removeAndCreateDir("testDB/store3");
        const network = MemoryNetwork.getTestNetwork();
        // 1
        const server1 = new MemoryServer();
        network.addServer("NODE1", server1);
        const state1 = new LocalStateManager("NODE1", "testDB/store4");
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
        const state2 = new LocalStateManager("NODE2", "testDB/store4");
        const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
        server1.AddServer({ newServer: "NODE2" });

        // 3
        const server3 = new MemoryServer();
        network.addServer("NODE3", server3);
        const state3 = new LocalStateManager("NODE3", "testDB/store4");
        const node3 = await RaftNode.create("NODE3", server3, state3, "MEMORY");
        server1.AddServer({ newServer: "NODE3" });

        await sleep(300);

        await server1.ClientRequest({
          type: CommandType.STORE_SSET,
          data: { setKey: "set", values: ["value1", "value2"]},
        });

        await sleep(500);

        const queryResponse = server1.ClientQuery({
          type: QueryType.SHAS,
          data: { setKey: "set", value: "value1" },
        });
        const queryResponse2 = server1.ClientQuery({
          type: QueryType.SHAS,
          data: { setKey: "set", value: "value3" },
        });
        expect(queryResponse.response).toEqual(true);
        expect(queryResponse2.response).toEqual(false);

        await server1.ClientRequest({
          type: CommandType.STORE_SDEL,
          data: { setKey: "set", values: ["value1", "value2"] },
        });

        await sleep(500);

        const queryResponse3 = server1.ClientQuery({
          type: QueryType.SHAS,
          data: { setKey: "set", value: "value1" },
        });
        const queryResponse4 = server1.ClientQuery({
          type: QueryType.SHAS,
          data: { setKey: "set", value: "value2" },
        });
        expect(queryResponse3.response).toEqual(false);
        expect(queryResponse4.response).toEqual(false);

        node1.stopListeners();
        node2.stopListeners();
        node3.stopListeners();
      });
    });
  });
});
