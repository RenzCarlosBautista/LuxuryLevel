import path from "path";
import { ensureDir, fileExists, readJson, writeJson } from "../utils/file";

const defaultReportsDir = path.join(process.cwd(), "src", "reports");

export function getReportsDir(): string {
  return process.env.REPORTS_DIR || defaultReportsDir;
}

export async function saveReport<T>(name: string, data: T): Promise<void> {
  const dir = getReportsDir();
  await ensureDir(dir);
  await writeJson(path.join(dir, name), data);
}

export async function loadReportIfExists<T>(name: string): Promise<T | null> {
  const dir = getReportsDir();
  const fullPath = path.join(dir, name);
  const exists = await fileExists(fullPath);
  if (!exists) {
    return null;
  }
  return readJson<T>(fullPath);
}
