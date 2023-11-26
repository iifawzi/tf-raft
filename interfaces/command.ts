export enum CommandType {
  TESTING = 1, // ONLY TO BE USED IN TESTING.
  NOOP = 2,
  MEMBERSHIP_ADD = 3,
  MEMBERSHIP_REMOVE = 4,
}
export interface Command<T> {
  type: CommandType;
  data: T;
}