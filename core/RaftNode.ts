import {
  Command,
  CommandType,
  LogEntry,
  PeerConnection,
  Query,
  QueryType,
  Server,
  StateManager,
} from "@/interfaces";
import { getRandomTimeout } from "@/utils";
import { STATES } from "./constants";
import {
  AddServerRequest,
  AppendEntryRequest,
  AppendEntryResponse,
  ClientQueryResponse,
  ClientRequestResponse,
  MEMBERSHIP_CHANGES_RESPONSES,
  MembershipChangeResponse,
  RemoveServerRequest,
  RequestVoteRequest,
  RequestVoteResponse,
} from "@/dtos";
import { membershipAddCMD, membershipRemoveCMD, noOpCMD } from "./commands";
import { Store } from "@/store/interfaces";
import { MemoryStore } from "@/store/memory.store";
import { PeerFactory } from "@/factories";
export class RaftNode {
  private peers: PeerConnection[] = [];
  private state!: STATES;
  private electionVotesForMe: number = 0;
  private electionVotesCount: number = 0;
  private electionTimeout: NodeJS.Timeout | undefined;
  private heartbeatInterval: NodeJS.Timeout | undefined;

  private constructor(
    private readonly id: string,
    private readonly server: Server,
    private readonly stateManager: StateManager,
    private readonly protocol: "RPC" | "MEMORY",
    private readonly leader: boolean,
    private readonly store: Store
  ) {
    this.id = id;
    this.server = server;
    this.server.listen(this);
    if (this.leader) {
      // it will start as follower, and it will be elected leader.
      this.becomeFollower();
    }
  }

  public static async create(
    id: string,
    server: Server,
    stateManager: StateManager,
    protocol: "RPC" | "MEMORY",
    leader = false
  ): Promise<RaftNode> {
    await stateManager.start();
    // start the node with current configuration so it can be caught up by future leaders.
    if (leader) {
      await stateManager.appendEntries([
        {
          term: 0,
          command: membershipAddCMD(id),
        },
      ]);
    }
    return new RaftNode(
      id,
      server,
      stateManager,
      protocol,
      leader,
      new MemoryStore()
    );
  }

  /**********************
  TIMEOUTS:
  **********************/
  private resetElectionTimeout() {
    clearTimeout(this.electionTimeout);
    console.log(`${this.nodeId} timeout has been reset`);
    this.electionTimeout = setTimeout(async () => {
      console.log(`${this.nodeId} election timeout finished`);
      await this.becomeCandidate();
    }, getRandomTimeout(150, 300));
  }

  private async leaderHeartbeats() {
    this.heartbeatInterval = setInterval(async () => {
      await this.sendHeartbeats();
    }, getRandomTimeout(100, 100));
  }

  /**********************
  State transitions handlers:
  **********************/
  public async becomeCandidate() {
    clearInterval(this.heartbeatInterval);
    this.changeState(STATES.CANDIDATE);
    await this.stateManager.IncrementCurrentTerm();
    // reset from last election:
    this.electionVotesForMe = 0;
    this.electionVotesCount = 0;
    // vote for itself:
    this.electionVotesForMe++;
    await this.stateManager.setVotedFor(this.id);
    this.resetElectionTimeout();
    // request votes:
    this.requestVotes();
  }

  private async becomeLeader() {
    clearTimeout(this.electionTimeout);
    this.changeState(STATES.LEADER);
    await this.stateManager.reset();
    await this.stateManager.appendEntries([
      {
        term: await this.stateManager.getCurrentTerm(),
        command: noOpCMD(this.nodeId),
      },
    ]);
    await this.leaderHeartbeats();
  }

  private async higherTermDiscovered(term: number) {
    // we need to clear the votes, preparing for next elections.
    await this.stateManager.setVotedFor(null);
    await this.stateManager.setCurrentTerm(term);
    this.becomeFollower();
  }

  private becomeFollower() {
    clearInterval(this.heartbeatInterval);
    this.changeState(STATES.FOLLOWER);
    this.resetElectionTimeout();
  }

  /**********************
  Leader Election: (Ch. 3.4)
  **********************/
  private async requestVotes() {
    let currentTerm = await this.stateManager.getCurrentTerm();
    const lastLog = await this.stateManager.getLastLogEntry();
    let lastLogTerm = lastLog.term;
    let lastLogIndex = await this.stateManager.getLastIndex();

    const request: RequestVoteRequest = {
      term: currentTerm,
      candidateId: this.nodeId,
      lastLogIndex: lastLogIndex,
      lastLogTerm: lastLogTerm,
    };

    for (let i = 0; i < this.peers.length; i++) {
      const peer = this.peers[i];
      peer.requestVote(request, this.voteReceived(currentTerm).bind(this));
    }

    if (this.peers.length === 0) {
      // single node will become leader;
      this.becomeLeader();
    }
  }

  /**
   *
   * @param electionTerm what was the term when we started election?
   * @param voteGranted whether vote is granted for the node or not
   * @param voterTerm the term of the voter.
   * @returns
   */
  private voteReceived(
    electionTerm: number
  ): (voterResponse: RequestVoteResponse) => void {
    return async (voterResponse: RequestVoteResponse): Promise<void> => {
      let currentTerm = await this.stateManager.getCurrentTerm();
      if (electionTerm !== currentTerm || this.state !== STATES.CANDIDATE) {
        // we can get here if one of the requests took too much time and we started another election round.
        // or if we already converted to leader or follower because a node/this-node had the majority already from the rest of the voters.
        return;
      }

      if (voterResponse.voteGranted) {
        this.electionVotesForMe++;
      } else {
        this.electionVotesCount++;
      }

      if (voterResponse.term > electionTerm) {
        // node is stale, will be switched to follower, votes will be reset, and election timeout will be reset.
        await this.higherTermDiscovered(voterResponse.term);
        return;
      }

      // peers + 1 to count current node.
      const quorum = Math.floor((this.peers.length + 1) / 2) + 1;
      if (this.electionVotesForMe >= quorum && this.state == STATES.CANDIDATE) {
        await this.becomeLeader();
      }
      // else: not yet leader.
    };
  }

  /**********************
  Appending Entries & Heartbeats:
  **********************/
  public async sendHeartbeats() {
    console.log(
      `${this.nodeId} sending heartbeat ${JSON.stringify(
        this.stateManager.getNextIndexes()
      )}`
    );
    let currentTerm = await this.stateManager.getCurrentTerm();
    let leaderCommit = this.stateManager.getCommitIndex();
    for (let i = 0; i < this.peers.length; i++) {
      const peer = this.peers[i];

      const logs = await this.stateManager.getLog();
      let prevLogTerm = -1;
      const nextIndex = this.stateManager.getNextIndex(peer.peerId);
      const prevLogIndex = nextIndex - 1;
      if (prevLogIndex >= 0) {
        const log = await this.stateManager.getLogAtIndex(prevLogIndex);
        prevLogTerm = log.term;
      }

      let entries: LogEntry[] = [];
      if (logs.length > nextIndex) {
        // send only the logs[nextIndex].
        // this can be improved as mentioned in the paper to send multiple logs at once.
        entries = [logs[nextIndex]];
      }

      const request: AppendEntryRequest = {
        term: currentTerm,
        leaderId: this.nodeId,
        prevLogIndex: prevLogIndex,
        prevLogTerm,
        entries,
        leaderCommit,
      };

      if (entries.length) {
        console.log(
          `${this.nodeId} is about to send log of index ${nextIndex} to node ${peer.peerId}`
        );
        console.log(this.stateManager.getNextIndexes());
      }
      peer.appendEntries(
        request,
        this.appendEntryResponseReceived(
          request.entries,
          peer.peerId,
          currentTerm
        ).bind(this)
      );
    }

    /**
     * Rules for servers, last point P13.
     */
    let nowTerm = await this.stateManager.getCurrentTerm();
    // guard, maybe state has changed in appendEntryResponseReceived
    if (this.state === STATES.LEADER && currentTerm === nowTerm) {
      const quorum = Math.floor((this.peers.length + 1) / 2) + 1;
      const commitIndex = this.stateManager.getCommitIndex();
      const log = await this.stateManager.getLog();
      for (let i = commitIndex + 1; i < log.length; i++) {
        const l = log[i];
        if (l.term == currentTerm) {
          let matched = 1; // leader
          for (let i = 0; i < this.peers.length; i++) {
            const matchedIndex = this.stateManager.getMatchIndex(
              this.peers[i].peerId
            );
            if (matchedIndex >= i) {
              matched++;
            }
          }
          if (matched >= quorum) {
            this.stateManager.setCommitIndex(i);
          }
        }
      }
      await this.applyLogs();
    }
  }

  private appendEntryResponseReceived(
    entries: LogEntry[],
    peerId: string,
    sentAtTerm: number
  ): (receiverResponse: AppendEntryResponse) => void {
    return async (receiverResponse: AppendEntryResponse) => {
      let currentTerm = await this.stateManager.getCurrentTerm();
      if (this.state !== STATES.LEADER || currentTerm !== sentAtTerm) {
        // we can get here if one of the requests took too much time, and node's state has changed
        return;
      }

      if (receiverResponse.term > currentTerm) {
        this.becomeFollower();
        return;
      }

      if (receiverResponse.success) {
        if (entries.length) {
          const currentNext = this.stateManager.getNextIndex(peerId);
          const nextIndex = currentNext + entries.length;
          this.stateManager.setNextIndex(peerId, nextIndex);
          console.log(
            `next of peer ${peerId} was ${currentNext} and is now ${this.stateManager.getNextIndex(
              peerId
            )}`
          );
          this.stateManager.setMatchIndex(peerId, nextIndex - 1);
        }
      } else {
        // Ch.3 P21 - Consistency checks failed.
        this.stateManager.setNextIndex(
          peerId,
          this.stateManager.getNextIndex(peerId) - 1
        );
      }
    };
  }

  /**********************
  Membership changes 
  **********************/

  public async addServerHandler(
    request: AddServerRequest
  ): Promise<MembershipChangeResponse> {
    const leader = this.stateManager.getLeaderId() ?? "";
    const response = {
      status: MEMBERSHIP_CHANGES_RESPONSES.OK,
      leaderHint: leader,
    };
    if (this.nodeState !== STATES.LEADER) {
      response.status = MEMBERSHIP_CHANGES_RESPONSES.NOT_LEADER;
      return response;
    }

    const currentTerm = await this.stateManager.getCurrentTerm();
    await this.stateManager.appendEntries([
      {
        term: currentTerm,
        command: membershipAddCMD(request.newServer),
      },
    ]);
    this.addPeer(request.newServer);
    return response;
  }

  public async removeServerHandler(
    request: RemoveServerRequest
  ): Promise<MembershipChangeResponse> {
    const leader = this.stateManager.getLeaderId() ?? "";
    const response = {
      status: MEMBERSHIP_CHANGES_RESPONSES.OK,
      leaderHint: leader,
    };
    if (this.nodeState !== STATES.LEADER) {
      response.leaderHint = leader;
      response.status = MEMBERSHIP_CHANGES_RESPONSES.NOT_LEADER;
      return response;
    }

    const currentTerm = await this.stateManager.getCurrentTerm();
    await this.stateManager.appendEntries([
      {
        term: currentTerm,
        command: membershipRemoveCMD(request.oldServer),
      },
    ]);
    this.removePeer(request.oldServer);
    return response;
  }

  private addPeer(serverIdentifier: string) {
    let peer!: PeerConnection;
    const peerIndex = this.peers.findIndex(
      (peer) => peer.peerId == serverIdentifier
    );
    if (peerIndex > -1) {
      this.peers.splice(peerIndex, 1);
    }

    peer = PeerFactory(this.protocol, serverIdentifier);

    this.stateManager.setNextIndex(peer.peerId, 0);
    this.stateManager.setMatchIndex(peer.peerId, -1);
    this.peers.push(peer);
  }

  private removePeer(serverIdentifier: string) {
    const peerIndex = this.peers.findIndex(
      (peer) => peer.peerId == serverIdentifier
    );
    if (peerIndex > -1) {
      this.peers.splice(peerIndex, 1);
    }
  }

  public applyMembershipAdd(serverIdentifier: string) {
    console.log(
      `${this.nodeId} is applying peer addition - adding: ${serverIdentifier}`
    );
    let peer!: PeerConnection;
    const peerIndex = this.peers.findIndex(
      (peer) => peer.peerId == serverIdentifier
    );
    if (peerIndex > -1) {
      this.peers.splice(peerIndex, 1);
    }

    peer = PeerFactory(this.protocol, serverIdentifier);
    this.peers.push(peer);
  }

  public applyMembershipRemove(serverIdentifier: string) {
    const peerIndex = this.peers.findIndex(
      (peer) => peer.peerId == serverIdentifier
    );
    if (peerIndex > -1) {
      this.peers.splice(peerIndex, 1);
    }
  }

  /**********************
  Leader Election and Log Replication
  **********************/
  public async requestVoteHandler(
    requester: RequestVoteRequest
  ): Promise<RequestVoteResponse> {
    this.resetElectionTimeout();
    let currentTerm = await this.stateManager.getCurrentTerm();

    const lastLog = await this.stateManager.getLastLogEntry();
    let lastLogTerm = lastLog.term;
    let lastLogIndex = await this.stateManager.getLastIndex();

    const response: any = {};
    if (requester.term < currentTerm) {
      // requester is stale, won't be granted vote and would be notified about the new term.
      response.voteGranted = false;
    } else {
      if (requester.term > currentTerm) {
        // node is stale, convert to follower, reset the election timeout, and reset votedFor.
        await this.higherTermDiscovered(requester.term);
      }
      currentTerm = requester.term;

      let votedFor = await this.stateManager.getVotedFor();
      if (votedFor === null || votedFor === requester.candidateId) {
        if (
          // does the requester have all entries committed in previous terms? (3.6)
          requester.lastLogTerm > lastLogTerm ||
          (requester.lastLogTerm === lastLogTerm &&
            requester.lastLogIndex >= lastLogIndex)
        ) {
          response.voteGranted = true;
          if (votedFor === null) {
            await this.stateManager.setVotedFor(requester.candidateId);
          }
        } else {
          response.voteGranted = false;
        }
      } else {
        // already voted for other node.
        response.voteGranted = false;
      }
    }

    response.term = currentTerm;
    return response;
  }

  public async appendEntryHandler(
    request: AppendEntryRequest
  ): Promise<AppendEntryResponse> {
    this.resetElectionTimeout();
    let currentTerm = await this.stateManager.getCurrentTerm();
    let commitIndex = this.stateManager.getCommitIndex();
    let prevLogEntry = await this.stateManager.getLogAtIndex(
      request.prevLogIndex
    );
    const response = {
      success: true,
      term: currentTerm,
    };
    if (
      request.term > currentTerm ||
      (request.term == currentTerm && this.state !== STATES.FOLLOWER)
    ) {
      await this.stateManager.setCurrentTerm(request.term);
      this.becomeFollower();
    } else if (currentTerm > request.term) {
      response.success = false;
      return response;
    }

    if (!prevLogEntry) {
      // Ch.3 P21 - Consistency checks failed.
      response.success = false;
      return response;
    }

    // updating leader to hint it to clients whenever needed.
    if (this.stateManager.getLeaderId() !== request.leaderId) {
      this.stateManager.setLeaderId(request.leaderId);
    }

    if (prevLogEntry.term !== request.prevLogTerm) {
      await this.stateManager.deleteFromIndexMovingForward(
        request.prevLogIndex
      );
    }

    await this.stateManager.appendEntries(request.entries);

    const lastIndex = await this.stateManager.getLastIndex();
    if (request.leaderCommit > commitIndex) {
      // leaderCommit if we already in sync, or lastIndex if the follower is behind the leader.
      // and there're entires that hasn't been sent yet.
      this.stateManager.setCommitIndex(
        Math.min(request.leaderCommit, lastIndex)
      );
    }

    await this.applyLogs();
    return response;
  }

  /**********************
   Setters and getters
   **********************/
  private changeState(state: STATES) {
    this.state = state;
  }

  get nodeId() {
    return this.id;
  }

  get nodeState() {
    return this.state;
  }

  get nodeStore() {
    return this.stateManager;
  }

  /**********************
   Client Interaction
   **********************/
  public async handleClientRequest(command: Command<any>): Promise<ClientRequestResponse> {
    // as an improvement here: we should reply with status and response only after the log is applied.
    const leaderId = this.stateManager.getLeaderId() ?? '';
    if (this.nodeState == STATES.LEADER) {
      const currentTerm = await this.stateManager.getCurrentTerm();
      await this.stateManager.appendEntries([{ term: currentTerm, command }]);
      return { status: true, leaderHint: leaderId };
    }
    return { status: false, leaderHint: leaderId };
  }

  public handleClientQuery(query: Query): ClientQueryResponse {
    // as an improvement, we can implement only-once semantics to achieve linerazability. Sec 6.4
    const leaderId = this.stateManager.getLeaderId() ?? '';
    if (this.nodeState == STATES.LEADER) {
      let value: string | null;
      switch(query.type) {
        case QueryType.GET:
          value = this.store.GET(query.data.key);
          break;
        case QueryType.HGET:
          value = this.store.HGET(query.data.hashKey, query.data.key);
          break;
      }
      return {
        status: true,
        leaderHint: leaderId,
        response: value ?? '',
      };
    }
    return {
      status: false,
      leaderHint: leaderId,
      response: '',
    };
  }
  /**********************
   Fixed membership configurator & utils
   **********************/
  public stopListeners() {
    clearTimeout(this.electionTimeout);
    clearInterval(this.heartbeatInterval);
  }

  /**********************
   LOG APPLIER
   **********************/
  private async applyLogs() {
    const commitIndex = this.stateManager.getCommitIndex();
    let lastApplied = this.stateManager.getLastApplied();
    if (commitIndex > lastApplied) {
      const logs = await this.stateManager.getLog();
      const logsToBeApplied = logs.slice(lastApplied + 1);

      for (let i = 0; i < logsToBeApplied.length; i++) {
        const log = logsToBeApplied[i];
        this.logApplier(log);
        lastApplied += 1;
        this.stateManager.setLastApplied(lastApplied);
      }
    }
  }

  private logApplier(logEntry: LogEntry) {
    switch (logEntry.command.type) {
      case CommandType.MEMBERSHIP_ADD:
        console.log("MEMBERSHIP_ADD command applier");
        if (logEntry.command.data !== this.nodeId) {
          this.applyMembershipAdd(logEntry.command.data);
        }
        break;
      case CommandType.MEMBERSHIP_REMOVE:
        console.log("MEMBERSHIP_REMOVE command applier");
        this.applyMembershipRemove(logEntry.command.data);
        break;
      case CommandType.STORE_SET:
        console.log("STORE_SET command applier");
        this.store.SET(logEntry.command.data.key, logEntry.command.data.value);
        break;
      case CommandType.STORE_DEL:
        console.log("STORE_DEL command applier");
        this.store.DEL(logEntry.command.data.key);
        break;
      case CommandType.STORE_HSET:
        console.log("STORE_HSET command applier");
        const hsetPairs = logEntry.command.data.pairs;
        this.store.HSET(logEntry.command.data.hashKey, hsetPairs);
        break;
      case CommandType.STORE_HDEL:
        console.log("STORE_HDEL command applier");
        const hdelKeys = logEntry.command.data.keys;
        this.store.HDEL(logEntry.command.data.hashKey, hdelKeys);
        break;
      default:
        console.log("UNHANDLED COMMAND", logEntry.command);
    }
  }
}