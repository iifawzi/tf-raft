export interface Store {
    SET(key: string, value: string): void;
    GET(key: string): string;
    DEL(key: string): void;
    GETALL(key: string): Map<string, string>;
}