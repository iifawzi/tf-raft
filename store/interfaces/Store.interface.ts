export interface Store {
    SET(key: string, value: string): void;
    GET(key: string): string;
    DEL(key: string): void;
    HSET(hashKey: string, pairs: [string]): void;
    HGET(hashKey: string, key: string): string | null;
    HDEL(hashKey: string, keys: [string]): void;
    SSET(setKey: string, values: string[]): void;
    SHAS(setKey: string, value: string): string | null;
    SDEL(setKey: string, values: [string]): void;
}