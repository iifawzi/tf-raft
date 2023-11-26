export enum CommandType {
  TESTING = "TESTING", // ONLY TO BE USED IN TESTING.
  NOOP = "NOOP",
  MEMBERSHIP_ADD = "MEMBERSHIP_ADD",
  MEMBERSHIP_REMOVE = "MEMBERSHIP_REMOVE",
}
export interface Command<T> {
  type: CommandType;
  data: T;
}
