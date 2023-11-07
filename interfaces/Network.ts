import { Connection } from "./Connection";

export interface Network{
    listen(port: number, listener: (nodeId: string, connection: Connection) => void): any
}