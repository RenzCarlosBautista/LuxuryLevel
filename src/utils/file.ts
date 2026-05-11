import { promises as fs } from "fs";
import path from "path";

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function writeJson(filePath: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, json, "utf-8");
}

export async function readJson<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content) as T;
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
