import { LogEntry, StateManager } from "@/interfaces";
import { JsonDB, Config } from "node-json-db";
import fs from "node:fs/promises";
import path from "node:path";

const persistentKeys = {
  CURRENT_TERM: "db.currentTerm",
  LOG: "db.log",
  VOTED_FOR: "db.votedFor",
};

// it uses jsondb for persistent data, and memory for volatile data.
export class LocalStateManager implements StateManager {
  private db!: JsonDB;
  private volatile: {
    commitIndex: number;
    lastApplied: number;
    nextIndex: Record<string, number>;
    matchIndex: Record<string, number>;
  } = {
    commitIndex: -1,
    lastApplied: -1,
    nextIndex: {},
    matchIndex: {},
  };
  constructor(private nodeId: string) {
    this.nodeId = nodeId;
  }

  public async startPersistentDB() {
    const directory = "./db";
    for (const file of await fs.readdir(directory)) {
      await fs.unlink(path.join(directory, file));
    }
    this.db = new JsonDB(new Config(`${directory}/` + this.nodeId, true, false, "."));
    await this.db.push(persistentKeys.CURRENT_TERM, -1);
    await this.db.push(persistentKeys.LOG, []);
    await this.db.push(persistentKeys.VOTED_FOR, -1);
  }

  ///// Persistent /////
  public async getCurrentTerm(): Promise<number> {
    return await this.db.getData(persistentKeys.CURRENT_TERM);
  }
  public async setCurrentTerm(term: number): Promise<void> {
    return await this.db.push(persistentKeys.CURRENT_TERM, term);
  }
  public async IncrementCurrentTerm(): Promise<void> {
    return await this.db.push(
      persistentKeys.CURRENT_TERM,
      (await this.db.getData(persistentKeys.CURRENT_TERM)) + 1
    );
  }
  public async getVotedFor(): Promise<string> {
    return await this.db.getData(persistentKeys.VOTED_FOR);
  }
  public async setVotedFor(nodeId: string | null): Promise<void> {
    return await this.db.push(persistentKeys.VOTED_FOR, nodeId);
  }

  public async getLog(): Promise<LogEntry[]> {
    return await this.db.getData(persistentKeys.LOG);
  }

  public async getLogAtIndex(index: number): Promise<LogEntry> {
    const log = await this.db.getData(persistentKeys.LOG);
    const logEntry = log[index];
    if (!logEntry) {
      return { term: -1, command: "" };
    }
    return log[index];
  }
  public async deleteFromIndexMovingForward(index: number): Promise<void> {
    console.log(
      `${this.nodeId} is deleting logs from index ${index} moving forward`
    );
    const log: Array<LogEntry> = await this.db.getData(persistentKeys.LOG);
    log.splice(index);
    await this.db.push(persistentKeys.LOG, log);
  }

  public async getLastLogEntry(): Promise<LogEntry> {
    const log = await this.db.getData(persistentKeys.LOG);
    console.log(`${this.nodeId} accessing last log entry`, log[log.length - 1]);
    const lastLog = log[log.length - 1];
    if (!lastLog) {
      return { term: -1, command: "" };
    }
    return log[log.length - 1];
  }

  public async getLastIndex(): Promise<number> {
    const log = await this.db.getData(persistentKeys.LOG);
    console.log(`${this.nodeId} accessing lastIndex`, log.length - 1);
    return log.length - 1;
  }

  public async appendEntries(logs: LogEntry[]): Promise<void> {
    console.log(`${this.nodeId} is appending entries`, logs);
    const log = await this.db.getData(persistentKeys.LOG);
    log.push(...logs);
    await this.db.push(persistentKeys.LOG, log);
  }

  ///// Volatile /////
  public getCommitIndex(): number {
    return this.volatile.commitIndex;
  }
  public setCommitIndex(index: number): void {
    this.volatile.commitIndex = index;
  }
  public getLastApplied(): number {
    return this.volatile.lastApplied;
  }
  public setLastApplied(index: number): void {
    this.volatile.lastApplied = index;
  }

  ///// Volatile Leader /////
  public getNextIndex(nodeId: string): number {
    return this.volatile.nextIndex[nodeId] !== undefined
      ? this.volatile.nextIndex[nodeId]
      : 0;
  }
  public setNextIndex(nodeId: string, value: number): void {
    this.volatile.nextIndex[nodeId] = value;
  }
  public getMatchIndex(nodeId: string): number {
    return this.volatile.matchIndex[nodeId] !== undefined
      ? this.volatile.matchIndex[nodeId]
      : -1;
  }
  public setMatchIndex(nodeId: string, value: number): void {
    this.volatile.matchIndex[nodeId] = value;
  }
  public async reset(): Promise<void> {
    this.volatile.matchIndex = {};

    const lastIndex = await this.getLastIndex();
    for (let key in this.volatile.nextIndex) {
      this.volatile.nextIndex[key] = lastIndex + 1;
    }
  }
}
