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

  HSET(hashKey: string, pairs: [string]): void {
    let hash = this.store.get(hashKey);
    if (!hash) {
      hash = new Map();
      this.store.set(hashKey, hash);
    }

    for ( let i = 0;i < pairs.length; i++) {
      const split = pairs[i].split(":");
      const key = split[0];
      const value = split[1];
      hash.set(key, value);
    }
    this.store.set(hashKey, hash);
  }

  HGET(hashKey: string, key: string): string | null {
    const hash = this.store.get(hashKey);
    if (!hash) {
      return null;
    }
    return hash.get(key);
  }
  
  HDEL(hashKey: string, keys: [string]): void {
    const hash = this.store.get(hashKey);
    if (hash) {
      for ( let i = 0; i < keys.length; i++) {
        hash.delete(keys[i]);
      }
    }
  }
}