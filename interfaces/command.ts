export enum CommandType {
  NOOP = 0,
  STORE_SET = 1,
  STORE_DEL = 2,
  MEMBERSHIP_ADD = 3,
  MEMBERSHIP_REMOVE = 4,
}

export interface Command<T> {
  type: CommandType;
  data: T;
}
