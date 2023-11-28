export enum CommandType {
  TESTING = 1, // ONLY TO BE USED IN TESTING.
  NOOP = 2,
  MEMBERSHIP_ADD = 3,
  MEMBERSHIP_REMOVE = 4,
  STORE_SET = 5,
  STORE_DEL = 6,
}
export interface Command<T> {
  type: CommandType;
  data: T;
}