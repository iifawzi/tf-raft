import { LogEntry, PeerConnection, Server, StateManager } from "@/interfaces";
import EventEmitter from "events";
import { getRandomTimeout } from "@/utils";
import { RAFT_CORE_EVENTS, STATES } from "./constants";
import {
  AppendEntryRequest,
  AppendEntryResponse,
  RequestVoteRequest,
  RequestVoteResponse,
} from "@/dtos";
export class RaftNode extends EventEmitter {
  private peers: PeerConnection[] = [];
  private state!: STATES;

  private electionVotesForMe: number = 0;
  private electionVotesCount: number = 0;
  private electionTimeout: NodeJS.Timeout | undefined;
  private heartbeatInterval: NodeJS.Timeout | undefined;

  private constructor(
    private readonly id: string,
    private readonly server: Server,
    private readonly stateManager: StateManager
  ) {
    super();
    this.id = id;
    this.server = server;
    this.server.listen(this);
    this.becomeFollower();
  }

  public static async create(
    id: string,
    server: Server,
    stateManager: StateManager
  ): Promise<RaftNode> {
    await stateManager.start();
    return new RaftNode(id, server, stateManager);
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
    this.changeState(STATES.LEADER);
    clearTimeout(this.electionTimeout);
    await this.stateManager.reset();
    this.stateManager.appendEntries([
      {
        term: await this.stateManager.getCurrentTerm(),
        command: `no-op-${this.nodeId}`,
      },
    ]);
    this.leaderHeartbeats();
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

    // peers + 1 to count current node.
    if (this.peers.length == 0) {
      // single node, become leader, quorum satisfied
      await this.becomeLeader();
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
      if (this.electionVotesForMe >= quorum) {
        await this.becomeLeader();
      } else {
        // not yet leader.
      }

      if (this.electionVotesCount - this.electionVotesForMe >= quorum) {
        // lost election, split-vote occurred or another leader won
      }
    };
  }

  /**********************
  Appending Entries & Heartbeats:
  **********************/
  private async sendHeartbeats() {
    console.log(`${this.nodeId} sending heartbeat`);
    let currentTerm = await this.stateManager.getCurrentTerm();
    let leaderCommit = this.stateManager.getCommitIndex();
    for (let i = 0; i < this.peers.length; i++) {
      const peer = this.peers[i];

      const logs = await this.stateManager.getLog();
      let prevLogTerm = -1;
      const nextIndex = this.stateManager.getNextIndex(peer.peerId);
      const prevLogIndex = nextIndex - 1;
      if (prevLogIndex >= 0) {
        prevLogTerm = (await this.stateManager.getLogAtIndex(prevLogIndex))
          .term;
      }

      let entriesList: LogEntry[] = [];
      if (logs.length > nextIndex) {
        // send only the logs[nextIndex].
        // this can be improved as mentioned in the paper to send multiple logs at once.
        entriesList = [logs[nextIndex]];
      }

      const request: AppendEntryRequest = {
        term: currentTerm,
        leaderId: this.nodeId,
        prevLogIndex: prevLogIndex,
        prevLogTerm,
        entriesList,
        leaderCommit,
      };

      if (entriesList.length) {
        console.log(
          `${this.nodeId} is about to send log of index ${nextIndex} to node ${peer.peerId}`
        );
        console.log(this.stateManager.getNextIndexes());
      }
      peer.appendEntries(
        request,
        this.appendEntryResponseReceived(
          request.entriesList,
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
          const nextIndex =
            this.stateManager.getNextIndex(peerId) + entries.length;
          this.stateManager.setNextIndex(peerId, nextIndex);
          console.log(
            `next of peer ${peerId} is now ${this.stateManager.getNextIndex(
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
  RPCs Handlers
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

    if (prevLogEntry.term !== request.prevLogTerm) {
      await this.stateManager.deleteFromIndexMovingForward(
        request.prevLogIndex
      );
    }

    await this.stateManager.appendEntries(request.entriesList);

    const lastIndex = await this.stateManager.getLastIndex();
    if (request.leaderCommit > commitIndex) {
      // leaderCommit if we already in sync, or lastIndex if the follower is behind the leader.
      // and there're entires that hasn't been sent yet.
      this.stateManager.setCommitIndex(
        Math.min(request.leaderCommit, lastIndex)
      );
    }

    return response;
  }

  /**********************
   Setters and getters
   **********************/
  private changeState(state: STATES) {
    this.state = state;
    this.emit(RAFT_CORE_EVENTS.STATE, state);
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
   Fixed membership configurator & utils
   **********************/
  public addPeers(peerConnections: PeerConnection[]) {
    this.peers.push(...peerConnections);
    for (let i = 0; i < peerConnections.length; i++) {
      const peer = peerConnections[i];
      this.stateManager.setNextIndex(peer.peerId, 0);
      this.stateManager.setMatchIndex(peer.peerId, -1);
    }
  }

  public replaceNetwork(peerConnections: PeerConnection[]) {
    this.peers.push(...peerConnections);
  }

  public stopListeners() {
    clearTimeout(this.electionTimeout);
    clearInterval(this.heartbeatInterval);
  }
}
