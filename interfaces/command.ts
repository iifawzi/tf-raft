export enum CommandType {
  NOOP = 0,
  STORE_SET = 1,
  STORE_DEL = 2,
  STORE_HSET = 3,
  STORE_HDEL = 4,
  MEMBERSHIP_ADD = 5,
  MEMBERSHIP_REMOVE = 6,
}

export interface Command<T> {
  type: CommandType;
  data: T;
}
