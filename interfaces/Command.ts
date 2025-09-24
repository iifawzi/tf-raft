export enum CommandType {
  NOOP = 0,
  // STRINGS
  STORE_SET = 1,
  STORE_DEL = 2,
  // HASH
  STORE_HSET = 3,
  STORE_HDEL = 4,
  // SET
  STORE_SSET = 5,
  STORE_SDEL = 6,
  // MEMBERSHIPS
  MEMBERSHIP_ADD = 7,
  MEMBERSHIP_REMOVE = 8,
}

export interface Command<T> {
  type: CommandType;
  data: T;
}
