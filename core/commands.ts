import { Command, CommandType } from "@/interfaces/command";

export function noOpCMD(nodeId: string): Command<string> {
  return {
    type: CommandType.NOOP,
    data: nodeId,
  };
}

export function membershipAddCMD(nodeId: string): Command<string> {
  return {
    type: CommandType.MEMBERSHIP_ADD,
    data: nodeId,
  };
}

export function membershipRemoveCMD(nodeId: string): Command<string> {
  return {
    type: CommandType.MEMBERSHIP_REMOVE,
    data: nodeId,
  };
}
