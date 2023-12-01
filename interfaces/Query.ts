export enum QueryType {
  GET = 0,
  HGET = 1,
}

export interface Query {
  type: QueryType;
  data: Record<string, string>;
}
