import { Connection, Network, StateManager } from "@/interfaces";
import EventEmitter from "events";
import { getRandomTimeout } from "@/utils";
import { EVENTS, STATES } from "./constants";
export class RaftNode extends EventEmitter {
  private peers: [] = [];
  private state: STATES;

  private electionVotesForMe: number = 0;
  private electionVotesCount: number = 0;
  private electionTimeout: NodeJS.Timeout | undefined;

  constructor(
    private readonly id: string,
    private readonly network: Network,
    private readonly stateManager: StateManager
  ) {
    super();
    this.id = id;
    this.state = STATES.FOLLOWER;
    this.network = network;
    this.network.listen(this.listener.bind(this));
    this.setElectionTimeout();
  }

  private listener(NodeId: string, connection: Connection): void {
    // TODO:: to be implemented.
  }

  /**********************
  TIMEOUTS:
  **********************/
  private setElectionTimeout() {
    clearInterval(this.electionTimeout);
    this.electionTimeout = setTimeout(() => {
      this.becomeCandidate();
      this.setElectionTimeout();
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
    // node vote for itself
    this.electionVotesForMe++;
    this.stateManager.persistent.setVotedFor(this.id);
    this.requestVotes();
  }

  private becomeLeader() {
    this.changeState(STATES.LEADER);
    this.setHeartBeatTimeout();
    
  }

  /**********************
  Leader Election: (Ch. 3.4)
  **********************/
  private requestVotes() {
    this.network.requestVotes(this.peers, this.voteReceived.bind(this));
  }

  private voteReceived(votedFor: string) {
    if (votedFor == this.id) {
      this.electionVotesForMe++;
    } else {
      this.electionVotesCount++;
    }

    // peers + 1 to count current node.
    const quorum = Math.floor((this.peers.length + 1) / 2) + 1;

    if (this.electionVotesForMe >= quorum) {
      this.becomeLeader();
      this.setElectionTimeout();
    } else {
      // not yet leader.
    }

    if (this.electionVotesCount - this.electionVotesForMe >= quorum) {
      // lost election, split-vote occurred or another leader won
    }
  }

  /**********************
  Setters and getters
  **********************/
  private changeState(state: STATES) {
    this.state = state;
    this.emit(EVENTS.STATE, state);
  }

  get nodeId() {
    return this.id;
  }
}
