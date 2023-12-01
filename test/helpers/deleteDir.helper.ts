import fs from "fs";
export async function removeAndCreateDir(dirName: string) {
    fs.rmSync(dirName, { recursive: true, force: true });
    fs.mkdirSync(dirName);
}