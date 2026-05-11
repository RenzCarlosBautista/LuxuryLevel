import { delay } from "./delay";

export interface RetryOptions {
  retries: number;
  delayMs: number;
  backoffFactor?: number;
}

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  let attempt = 0;
  let waitMs = options.delayMs;
  let lastError: unknown;

  while (attempt <= options.retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === options.retries) {
        break;
      }
      await delay(waitMs);
      waitMs = Math.round(waitMs * (options.backoffFactor ?? 1.5));
      attempt += 1;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Retry failed");
}
