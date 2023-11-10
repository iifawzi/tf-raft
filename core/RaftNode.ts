import { Connection, Server, StateManager } from "@/interfaces";
import EventEmitter from "events";
import { getRandomTimeout } from "@/utils";
import { RAFT_CORE_EVENTS, STATES } from "./constants";
import { RequestVoteRequest, RequestVoteResponse } from "@/dtos";
export class RaftNode extends EventEmitter {
  private peers: Connection[] = [];
  private state: STATES;

  private electionVotesForMe: number = 0;
  private electionVotesCount: number = 0;
  private electionTimeout: NodeJS.Timeout | undefined;

  constructor(
    private readonly id: string,
    private readonly server: Server,
    private readonly stateManager: StateManager
  ) {
    super();
    this.id = id;
    this.state = STATES.FOLLOWER;
    this.server = server;
    this.server.listen(this);
    this.resetElectionTimeout();
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

  private setHeartBeatTimeout() {
    // TODO:: to be implemented
  }

  /**********************
  State transitions handlers:
  **********************/
  private becomeCandidate() {
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
    this.changeState(STATES.LEADER);
    this.setHeartBeatTimeout();
  }

  public higherTermDiscovered(term: number) {
    // we need to clear the votes, preparing for next elections.
    this.stateManager.persistent.setVotedFor(null);
    this.stateManager.persistent.setCurrentTerm(term);
    this.becomeFollower();
  }

  private becomeFollower() {
    this.changeState(STATES.FOLLOWER);
    this.resetElectionTimeout();
  }
  /**********************
  Leader Election: (Ch. 3.4)
  **********************/
  private requestVotes() {
    // this.server.requestVotes(this.peers, this.voteReceived.bind(this));
  }

  /**
   *
   * @param electionTerm what was the term when we started election?
   * @param voteGranted whether vote is granted for the node or not
   * @param voterTerm the term of the voter.
   * @returns
   */
  private voteReceived(
    electionTerm: number,
    voteGranted: boolean,
    voterTerm: number
  ) {
    let currentTerm = this.stateManager.persistent.getCurrentTerm();
    if (electionTerm !== currentTerm || this.state !== STATES.CANDIDATE) {
      // we can reach here if one of the requests took too much time and we started another election round.
      // or if we already converted to leader or follower because we had the majority already from the rest of the voters.
      return;
    }

    if (voteGranted) {
      this.electionVotesForMe++;
    } else {
      this.electionVotesCount++;
    }

    if (voterTerm > electionTerm) {
      // node is stale, will be switched to follower, votes will be reset, and election timeout to be reset.
      this.higherTermDiscovered(voterTerm);
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
  }

  /**********************
  RPCs Handlers
  **********************/
  public requestVoteHandler(
    requester: RequestVoteRequest
  ): RequestVoteResponse {
    this.resetElectionTimeout();
    let currentTerm = this.stateManager.persistent.getCurrentTerm();

    // TODO:: Handle when log is finalized
    let lastLogTerm = this.stateManager.persistent.getLastLogEntry().term;
    let lastLogIndex = this.stateManager.persistent.getLastLogEntry().index;

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
