import { evaluateDirect } from "./direct";
import type { JevResponse, QuestionSpec } from "./types";

// Jev pricing: $0.042 per million input tokens. Output tokens are free
// because there is no autoregressive generation to meter.
export const INPUT_COST_PER_M_TOKENS = 0.042;

export function hasTypesafeKey(): boolean {
  return Boolean(process.env.TYPESAFE_API_KEY);
}

export interface Evaluation {
  response: JevResponse;
  latencyMs: number;
  tokens: { input: number; output: number };
  costUsd: number;
}

// One call = one decision. Measures latency and computes the cost estimate
// from the token usage the TypeSafe API reports.
export async function evaluate(
  state: string,
  questions: Record<string, QuestionSpec>
): Promise<Evaluation> {
  const key = process.env.TYPESAFE_API_KEY;
  if (!key) throw new Error("TYPESAFE_API_KEY is not set");

  const started = performance.now();
  const response = await evaluateDirect(state, questions, key);
  const latencyMs = Math.max(1, Math.round(performance.now() - started));
  const tokens = {
    input: response.usage?.input_tokens ?? Math.ceil(state.length / 4),
    output: response.usage?.output_tokens ?? 0,
  };
  return {
    response,
    latencyMs,
    tokens,
    costUsd: (tokens.input / 1_000_000) * INPUT_COST_PER_M_TOKENS,
  };
}

// Small worker pool so the queue runs fast without hammering the API.
export async function mapPool<T, R>(
  items: T[],
  size: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const idx = next++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, () => worker())
  );
  return results;
}
