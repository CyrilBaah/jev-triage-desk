import type { JevResponse, QuestionSpec } from "./types";

const TYPESAFE_API_URL = "https://api.typesafe.ai/v1/systemone";

// One POST to the TypeSafe direct API. All questions are answered in
// parallel inside this single request; the response carries typed answers
// plus token usage. Output tokens are free — only input is billed.
export async function evaluateDirect(
  state: string,
  questions: Record<string, QuestionSpec>,
  apiKey: string
): Promise<JevResponse> {
  const res = await fetch(TYPESAFE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "jev-latest", state, questions }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TypeSafe API ${res.status}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as JevResponse;
}
