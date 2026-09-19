import type {
  ChoiceAnswer,
  NoulAnswer,
  ScoreAnswer,
} from "./jev/types";

export type Lane = "human" | "agent" | "archive";

export interface TriageAnswers {
  department: ChoiceAnswer;
  urgency: ScoreAnswer;
  escalate: NoulAnswer;
  spam: NoulAnswer;
}

// The "traffic cop": thresholds turn Jev's probabilities into a lane.
// Tune these to move the human/automation split for your own queue.
export const THRESHOLDS = {
  spamArchive: 0.6, // spam.noul >= 0.6  -> archive
  escalateToHuman: 0.6, // escalate.noul >= 0.6 -> human
  urgentScore: 2.5, // urgency.score >= 2.5 -> human
  agentMinScore: 1.0, // urgency.score >= 1.0 -> agent draft
};

export function route(answers: TriageAnswers): {
  lane: Lane;
  reason: string;
} {
  const spamPct = Math.round(answers.spam.noul * 100);
  const escPct = Math.round(answers.escalate.noul * 100);
  const urgency = answers.urgency.score.toFixed(1);

  if (answers.spam.noul >= THRESHOLDS.spamArchive) {
    return { lane: "archive", reason: `spam probability ${spamPct}%` };
  }
  if (answers.escalate.noul >= THRESHOLDS.escalateToHuman) {
    return { lane: "human", reason: `needs-human probability ${escPct}%` };
  }
  if (answers.urgency.score >= THRESHOLDS.urgentScore) {
    return { lane: "human", reason: `urgency ${urgency}/3` };
  }
  if (answers.urgency.score >= THRESHOLDS.agentMinScore) {
    return { lane: "agent", reason: `urgency ${urgency}/3` };
  }
  return { lane: "archive", reason: `urgency ${urgency}/3, FAQ auto-reply` };
}
