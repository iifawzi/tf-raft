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
    this.stateManager.persistent.IncrementCurrentTerm();
    // reset from last election:
    this.electionVotesForMe = 0;
    this.electionVotesCount = 0;
    // vote for itself:
    this.electionVotesForMe++;
    this.stateManager.persistent.setVotedFor(this.id);
    this.resetElectionTimeout();
    // request votes:
    this.requestVotes();
  }

  private becomeLeader() {
    this.stateManager.volatileLeader.reset();
    this.changeState(STATES.LEADER);
    this.leaderHeartbeats();
  }

  private higherTermDiscovered(term: number) {
    // we need to clear the votes, preparing for next elections.
    this.stateManager.persistent.setVotedFor(null);
    this.stateManager.persistent.setCurrentTerm(term);
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
  private requestVotes() {
    let currentTerm = this.stateManager.persistent.getCurrentTerm();
    let lastLogTerm = this.stateManager.persistent.getLastLogEntry().term;
    let lastLogIndex = this.stateManager.persistent.getLastIndex();

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
    return (voterResponse: RequestVoteResponse): void => {
      let currentTerm = this.stateManager.persistent.getCurrentTerm();
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
  private sendHeartbeats() {
    let currentTerm = this.stateManager.persistent.getCurrentTerm();
    let leaderCommit = this.stateManager.volatile.getCommitIndex();
    for (let i = 0; i < this.peers.length; i++) {
      const peer = this.peers[i];

      const logs = this.stateManager.persistent.getLog();
      let prevLogTerm = -1;
      const nextIndex = this.stateManager.volatileLeader.getNextIndex(
        peer.peerId
      );
      const prevLogIndex = nextIndex - 1;
      if (prevLogIndex >= 0) {
        prevLogTerm =
          this.stateManager.persistent.getLogAtIndex(prevLogIndex).term;
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

      peer.appendEntry(
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
    let nowTerm = this.stateManager.persistent.getCurrentTerm();
    // guard, maybe state has changed in appendEntryResponseReceived
    if (this.state === STATES.LEADER && currentTerm === nowTerm) {
      const quorum = Math.floor((this.peers.length + 1) / 2) + 1;
      const commitIndex = this.stateManager.volatile.getCommitIndex();
      const log = this.stateManager.persistent.getLog();
      for (let i = commitIndex + 1; i < log.length; i++) {
        const l = log[i];
        if (l.term == currentTerm) {
          let matched = 1; // leader
          for (let i = 0; i < this.peers.length; i++) {
            const matchedIndex = this.stateManager.volatileLeader.getMatchIndex(
              this.peers[i].peerId
            );
            if (matchedIndex >= i) {
              matched++;
            }
          }
          if (matched >= quorum) {
            this.stateManager.volatile.setCommitIndex(i);
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
    return (receiverResponse: AppendEntryResponse) => {
      let currentTerm = this.stateManager.persistent.getCurrentTerm();
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
          this.stateManager.volatileLeader.getNextIndex(peerId) +
          entries.length;
        this.stateManager.volatileLeader.setNextIndex(peerId, nextIndex);
        this.stateManager.volatileLeader.setMatchIndex(peerId, nextIndex - 1);
      } else {
        // Ch.3 P21 - Consistency checks failed.
        this.stateManager.volatileLeader.setNextIndex(
          peerId,
          this.stateManager.volatileLeader.getNextIndex(peerId) - 1
        );
      }
    };
  }

  /**********************
  RPCs Handlers
  **********************/
  public requestVoteHandler(
    requester: RequestVoteRequest
  ): RequestVoteResponse {
    this.resetElectionTimeout();
    let currentTerm = this.stateManager.persistent.getCurrentTerm();

    let lastLogTerm = this.stateManager.persistent.getLastLogEntry().term;
    let lastLogIndex = this.stateManager.persistent.getLastIndex();

    const response: any = {};
    if (requester.term < currentTerm) {
      // requester is stale, won't be granted vote and would be notified about the new term.
      response.voteGranted = false;
    } else {
      if (requester.term > currentTerm) {
        // node is stale, convert to follower, reset the election timeout, and reset votedFor.
        this.higherTermDiscovered(requester.term);
      }
      currentTerm = requester.term;

      let votedFor = this.stateManager.persistent.getVotedFor();
      if (votedFor === null || votedFor === requester.candidateId) {
        if (
          // does the requester have all entries committed in previous terms? (3.6)
          requester.lastLogTerm > lastLogTerm ||
          (requester.lastLogTerm === lastLogTerm &&
            requester.lastLogIndex >= lastLogIndex)
        ) {
          response.voteGranted = true;
          if (votedFor === null) {
            this.stateManager.persistent.setVotedFor(requester.candidateId);
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
}
