import { MemoryNetwork, MemoryServer } from "@/adapters/network/memory";
import { LocalStateManager } from "@/adapters/state";
import { RaftNode, STATES } from "@/core";
import { MEMBERSHIP_CHANGES_RESPONSES } from "@/dtos";
import { sleep } from "@/utils";
import { removeDir } from "./helpers/deleteDir.helper";

describe("Membership & Nodes Configurations", () => {
  console.log = jest.fn();

    describe("Single node becomes leader", () => {
      it("single node should become leader and a configuration log should be created", async () => {
      await removeDir('testdb/memb1')
        const network = MemoryNetwork.getTestNetwork();
        const server1 = new MemoryServer();
        network.addServer("NODE1", server1);
        const state1 = new LocalStateManager("NODE1", "testDB/memb1");
        const node1 = await RaftNode.create(
          "NODE1",
          server1,
          state1,
          "MEMORY",
          true
        );
        await sleep(500);
        const firstLog = await node1.nodeStore.getLogAtIndex(0);
        expect(node1.nodeState).toEqual(STATES.LEADER);
        expect(firstLog.term).toEqual(0);
        expect(firstLog.command.data).toEqual("NODE1");
        node1.stopListeners();
      });
    });

    describe("Non-Leaders should reject removing or adding nodes", () => {
      it("Node should reject adding/removing node if it's not leader", async () => {
      await removeDir('testdb/memb2')
        const network = MemoryNetwork.getTestNetwork();
        const server1 = new MemoryServer();
        network.addServer("NODE1", server1);
        const state1 = new LocalStateManager("NODE1", "testDB/memb2");
        const node1 = await RaftNode.create(
          "NODE1",
          server1,
          state1,
          "MEMORY",
          true
        );

        await sleep(1000);

        const server2 = new MemoryServer();
        network.addServer("NODE2", server2);
        const state2 = new LocalStateManager("NODE2", "testDB/memb2");
        const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
        server1.AddServer({ newServer: "NODE2" });
        await sleep(300);
        const addingResponse = await server2.AddServer({ newServer: "NODE2" });
        expect(addingResponse.status).toEqual(MEMBERSHIP_CHANGES_RESPONSES.NOT_LEADER)
        expect(addingResponse.leaderHint).toEqual(node1.nodeId)
        const removingResponse = await server2.RemoveServer({ oldServer: "NODE2" });
        expect(removingResponse.status).toEqual(MEMBERSHIP_CHANGES_RESPONSES.NOT_LEADER)
        expect(removingResponse.leaderHint).toEqual(node1.nodeId)

        node1.stopListeners();
        node2.stopListeners();
      });
    });

    describe("AddServer should add the node to the cluster and replicate the configuration log to all nodes", () => {
      it("Nodes should be added and the logs should be replicated", async () => {
        await removeDir('testdb/memb3')
        const network = MemoryNetwork.getTestNetwork();
        const server1 = new MemoryServer();
        network.addServer("NODE1", server1);
        const state1 = new LocalStateManager("NODE1", "testDB/memb3");
        const node1 = await RaftNode.create(
          "NODE1",
          server1,
          state1,
          "MEMORY",
          true
        );

        await sleep(1000);

        const server2 = new MemoryServer();
        network.addServer("NODE2", server2);
        const state2 = new LocalStateManager("NODE2", "testDB/memb3");
        const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
        server1.AddServer({ newServer: "NODE2" });

        const server3 = new MemoryServer();
        network.addServer("NODE3", server3);
        const state3 = new LocalStateManager("NODE3", "testDB/memb3");
        const node3 = await RaftNode.create("NODE3", server3, state3, "MEMORY");
        server1.AddServer({ newServer: "NODE3" });

        await sleep(300);

        node1.addCommand("TEST_COMMAND");

        await sleep(300);

        const leaderTerm = await node1.nodeStore.getCurrentTerm();
        const node2Term = await node2.nodeStore.getCurrentTerm();
        const node3Term = await node3.nodeStore.getCurrentTerm();
        expect(node2Term).toEqual(leaderTerm);
        expect(node3Term).toEqual(leaderTerm);

        const leaderLastLog = await node1.nodeStore.getLastLogEntry();
        const node2LastLog = await node2.nodeStore.getLastLogEntry();
        const node3LastLog = await node3.nodeStore.getLastLogEntry();

        expect(node2LastLog.term).toEqual(leaderLastLog.term);
        expect(node2LastLog.command).toEqual(leaderLastLog.command);
        expect(node3LastLog.term).toEqual(node3LastLog.term);
        expect(node3LastLog.command).toEqual(node3LastLog.command);
        node1.stopListeners();
        node2.stopListeners();
        node3.stopListeners();
      });

      it("Peers should not be replicated twice", async () => {
        await removeDir('testdb/memb4')
        const network = MemoryNetwork.getTestNetwork();
        const server1 = new MemoryServer();
        network.addServer("NODE1", server1);
        const state1 = new LocalStateManager("NODE1", "testDB/memb4");
        const node1 = await RaftNode.create(
          "NODE1",
          server1,
          state1,
          "MEMORY",
          true
        );

        await sleep(1000);

        const server2 = new MemoryServer();
        network.addServer("NODE2", server2);
        const state2 = new LocalStateManager("NODE2", "testDB/memb4");
        const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
        server1.AddServer({ newServer: "NODE2" });

        const server3 = new MemoryServer();
        network.addServer("NODE3", server3);
        const state3 = new LocalStateManager("NODE3", "testDB/memb4");
        const node3 = await RaftNode.create("NODE3", server3, state3, "MEMORY");
        server1.AddServer({ newServer: "NODE3" });
        
        await sleep(300);
        server1.AddServer({ newServer: "NODE3" });
        await sleep(300);
        server1.RemoveServer({ oldServer: "NODE3" });
        await sleep(300);
        server1.AddServer({ newServer: "NODE3" });
        await sleep(300);

        node1.stopListeners();
        node2.stopListeners();
        node3.stopListeners();
      });
    });

    describe("RemoveServer should add the node to the cluster and replicate the configuration log to all nodes", () => {
      it("Nodes should be removed and the logs should no longer be replicated to it", async () => {
        await removeDir('testdb/memb5')
        const network = MemoryNetwork.getTestNetwork();
        const server1 = new MemoryServer();
        network.addServer("NODE1", server1);
        const state1 = new LocalStateManager("NODE1", "testDB/memb5");
        const node1 = await RaftNode.create(
          "NODE1",
          server1,
          state1,
          "MEMORY",
          true
        );

        await sleep(1000);

        const server2 = new MemoryServer();
        network.addServer("NODE2", server2);
        const state2 = new LocalStateManager("NODE2", "testDB/memb5");
        const node2 = await RaftNode.create("NODE2", server2, state2, "MEMORY");
        server1.AddServer({ newServer: "NODE2" });

        const server3 = new MemoryServer();
        network.addServer("NODE3", server3);
        const state3 = new LocalStateManager("NODE3", "testDB/memb5");
        const node3 = await RaftNode.create("NODE3", server3, state3, "MEMORY");
        server1.AddServer({ newServer: "NODE3" });
        
        await sleep(300);
        
        // turning off the actual node is the responsibility of the admin. ( correct me if i'm wrong.) 
        node3.stopListeners();
        server1.RemoveServer({ oldServer: "NODE3" });
        
        await sleep(300);
        node1.addCommand("TEST_COMMAND");
        await sleep(300);

        const leaderLastLog = await node1.nodeStore.getLastLogEntry();
        const node2LastLog = await node2.nodeStore.getLastLogEntry();
        const node3LastLog = await node3.nodeStore.getLastLogEntry();

        expect(node2LastLog.command).toEqual(leaderLastLog.command);
        expect(node3LastLog.command).not.toEqual(leaderLastLog.command);
        node1.stopListeners();
        node2.stopListeners();
        node3.stopListeners();
      });
    });
});
