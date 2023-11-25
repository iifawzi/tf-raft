import fs from "fs";
export async function removeDir(dirName: string) {
    fs.rmSync(dirName, { recursive: true, force: true });
}