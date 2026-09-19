import { NextResponse } from "next/server";
import { evaluate, hasTypesafeKey, mapPool } from "@/lib/jev";
import { TRIAGE_QUESTIONS } from "@/lib/jev/questions";
import type { ChoiceAnswer, ScoreAnswer } from "@/lib/jev/types";
import { SEED_TICKETS, type Ticket } from "@/lib/tickets";
import { route, type Lane, type TriageAnswers } from "@/lib/router";
import { draftReply } from "@/lib/agent";

export interface TriageResult {
  id: string;
  subject: string;
  text: string;
  department: ChoiceAnswer;
  urgency: ScoreAnswer;
  escalate: number;
  spam: number;
  lane: Lane;
  reason: string;
  latencyMs: number;
  inputTokens: number;
  costUsd: number;
  draft: { engine: string; text: string } | null;
  error?: string;
}

export interface TriageSummary {
  backend: string;
  count: number;
  avgLatencyMs: number;
  medianLatencyMs: number;
  inputTokens: number;
  costUsd: number;
  lanes: Record<Lane, number>;
}

async function triageTicket(ticket: Ticket): Promise<TriageResult> {
  try {
    const ev = await evaluate(ticket.text, TRIAGE_QUESTIONS);
    const answers = ev.response.answers as unknown as TriageAnswers;
    const decision = route(answers);

    let draft: TriageResult["draft"] = null;
    if (decision.lane === "agent") {
      const d = await draftReply(
        ticket.subject,
        ticket.text,
        answers.department.choice
      );
      draft = { engine: d.engine, text: d.text };
    }

    return {
      id: ticket.id,
      subject: ticket.subject,
      text: ticket.text,
      department: answers.department,
      urgency: answers.urgency,
      escalate: answers.escalate.noul,
      spam: answers.spam.noul,
      lane: decision.lane,
      reason: decision.reason,
      latencyMs: ev.latencyMs,
      inputTokens: ev.tokens.input,
      costUsd: ev.costUsd,
      draft,
    };
  } catch (err) {
    return {
      id: ticket.id,
      subject: ticket.subject,
      text: ticket.text,
      department: {
        type: "choice",
        choice: "unknown",
        confidence: 0,
        probabilities: {},
      },
      urgency: { type: "score", score: 0, confidence: 0, probabilities: {} },
      escalate: 0,
      spam: 0,
      lane: "archive",
      reason: "error",
      latencyMs: 0,
      inputTokens: 0,
      costUsd: 0,
      draft: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const mode: string = body?.mode ?? "seed";

  const items: Ticket[] =
    mode === "custom"
        ? [
            {
              // Unique per submission so custom tickets can stack in the queue.
              id: `TCK-YOU-${Date.now().toString(36).toUpperCase()}`,
              subject: String(body?.subject || "Your ticket"),
              text: String(body?.text || ""),
            },
          ]
        : SEED_TICKETS;

  if (!hasTypesafeKey()) {
    return NextResponse.json(
      { error: "TYPESAFE_API_KEY is not set. Add it to .env and restart." },
      { status: 500 }
    );
  }

  if (mode === "custom" && !items[0].text.trim()) {
    return NextResponse.json(
      { error: "Paste a ticket message to triage." },
      { status: 400 }
    );
  }

  const results = await mapPool(items, 5, (t) => triageTicket(t));

  const lanes: Record<Lane, number> = { human: 0, agent: 0, archive: 0 };
  let latencySum = 0;
  let inputTokens = 0;
  let costUsd = 0;
  for (const r of results) {
    lanes[r.lane]++;
    latencySum += r.latencyMs;
    inputTokens += r.inputTokens;
    costUsd += r.costUsd;
  }
  const sortedLatencies = results.map((r) => r.latencyMs).sort((a, b) => a - b);

  const summary: TriageSummary = {
    backend: "typesafe",
    count: results.length,
    avgLatencyMs: results.length
      ? Math.round(latencySum / results.length)
      : 0,
    medianLatencyMs:
      sortedLatencies[Math.floor(sortedLatencies.length / 2)] ?? 0,
    inputTokens,
    costUsd,
    lanes,
  };

  return NextResponse.json({ results, summary });
}
