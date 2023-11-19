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
  public state!: STATES;

  private electionVotesForMe: number = 0;
  private electionVotesCount: number = 0;
  private electionTimeout: NodeJS.Timeout | undefined;
  private heartbeatInterval: NodeJS.Timeout | undefined;

  constructor(
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

  /**********************
  TIMEOUTS:
  **********************/
  private resetElectionTimeout() {
    clearTimeout(this.electionTimeout);
    this.electionTimeout = setTimeout(() => {
      this.becomeCandidate();
    }, getRandomTimeout(150, 300));
  }

  private leaderHeartbeats() {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeats();
    }, getRandomTimeout(50, 50));
  }

  /**********************
  State transitions handlers:
  **********************/
  private becomeCandidate() {
    clearInterval(this.heartbeatInterval);
    this.changeState(STATES.CANDIDATE);
    this.stateManager.IncrementCurrentTerm();
    // reset from last election:
    this.electionVotesForMe = 0;
    this.electionVotesCount = 0;
    // vote for itself:
    this.electionVotesForMe++;
    this.stateManager.setVotedFor(this.id);
    this.resetElectionTimeout();
    // request votes:
    this.requestVotes();
  }

  private async becomeLeader() {
    this.stateManager.reset();
    this.changeState(STATES.LEADER);
    // TODO:: check this and improve no-op command.
    this.stateManager.appendEntries([
      {
        term: await this.stateManager.getCurrentTerm(),
        command: "no-op",
      },
    ]);
    this.leaderHeartbeats();
  }

  private higherTermDiscovered(term: number) {
    // we need to clear the votes, preparing for next elections.
    this.stateManager.setVotedFor(null);
    this.stateManager.setCurrentTerm(term);
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
    let lastLogTerm = (await this.stateManager.getLastLogEntry()).term;
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
        this.higherTermDiscovered(voterResponse.term);
        return;
      }

      // peers + 1 to count current node.
      const quorum = Math.floor((this.peers.length + 1) / 2) + 1;
      if (this.electionVotesForMe >= quorum) {
        this.becomeLeader();
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
      if ((await logs).length > nextIndex) {
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

      peer.appendEntries(
        request,
        this.appendEntryResponseReceived(
          request.entriesList,
          peer.peerId,
          await currentTerm
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
        // we can get here if one of the requests took too much time, and node's state has been changed
        return;
      }

      if (receiverResponse.term > currentTerm) {
        this.becomeFollower();
        return;
      }

      if (receiverResponse.success) {
        const nextIndex =
          this.stateManager.getNextIndex(peerId) + entries.length;
        this.stateManager.setNextIndex(peerId, nextIndex);
        this.stateManager.setMatchIndex(peerId, nextIndex - 1);
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

    let lastLogTerm = (await this.stateManager.getLastLogEntry()).term;
    let lastLogIndex = await this.stateManager.getLastIndex();

    const response: any = {};
    if (requester.term < (await currentTerm)) {
      // requester is stale, won't be granted vote and would be notified about the new term.
      response.voteGranted = false;
    } else {
      if (requester.term > (await currentTerm)) {
        // node is stale, convert to follower, reset the election timeout, and reset votedFor.
        this.higherTermDiscovered(requester.term);
      }
      currentTerm = requester.term;

      let votedFor = this.stateManager.getVotedFor();
      if (votedFor === null || (await votedFor) === requester.candidateId) {
        if (
          // does the requester have all entries committed in previous terms? (3.6)
          requester.lastLogTerm > lastLogTerm ||
          (requester.lastLogTerm === lastLogTerm &&
            requester.lastLogIndex >= lastLogIndex)
        ) {
          response.voteGranted = true;
          if (votedFor === null) {
            this.stateManager.setVotedFor(requester.candidateId);
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

  public async appendEntryHandler(request: AppendEntryRequest): Promise<AppendEntryResponse> {
    let currentTerm = await this.stateManager.getCurrentTerm();
    let commitIndex = this.stateManager.getCommitIndex();
    let prevLogEntry = this.stateManager.getLogAtIndex(request.prevLogIndex);
    const response = {
      success: true,
      term: currentTerm,
    };
    if (
      request.term > currentTerm ||
      (request.term == currentTerm && this.state !== STATES.FOLLOWER)
    ) {
      this.stateManager.setCurrentTerm(request.term);
      this.becomeFollower();
    } else if (currentTerm > request.term) {
      response.success = false;
      return response;
    }

    if (!prevLogEntry) {
      response.success = false;
      return response;
    }

    if ((await prevLogEntry).term !== request.prevLogTerm) {
      this.stateManager.deleteFromIndexMovingForward(request.prevLogIndex);
    }

    this.stateManager.appendEntries(request.entriesList);

    const lastIndex = await this.stateManager.getLastIndex();
    if (request.leaderCommit > commitIndex) {
      // leaderCommit if we're already in sync, or lastIndex if the follower is behind the leader.
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

    /**********************
   Fixed membership configurator
   **********************/
  public addPeers(peerConnections: PeerConnection[]) {
    this.peers.push(...peerConnections);
  }
}
