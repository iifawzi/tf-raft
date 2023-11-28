import { Store } from "./interfaces";

export class MemoryStore implements Store {
  private store = new Map();

  SET(key: string, value: string): void {
    this.store.set(key, value);
  }

  GET(key: string): string {
    return this.store.get(key);
  }

  DEL(key: string): void {
    this.store.delete(key);
  }

  GETALL(): Map<string, string> {
    return this.store;
  }
}
