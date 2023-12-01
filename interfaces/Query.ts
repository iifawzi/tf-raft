export enum QueryType {
  GET = 0,
  HGET = 1,
  SHAS = 2,
}

export interface Query {
  type: QueryType;
  data: Record<string, string>;
}
