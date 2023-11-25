export enum CommandType {
    NOOP = 'NOOP',
    MEMBERSHIP_ADD = 'MEMBERSHIP_ADD',
    MEMBERSHIP_REMOVE = 'MEMBERSHIP_REMOVE',

}
export interface Command<T> {
    type: CommandType
    data: T
}