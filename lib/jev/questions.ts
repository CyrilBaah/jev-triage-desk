import type { QuestionSpec } from "./types";

// The triage schema: four typed questions Jev answers in ONE parallel call.
// choice -> which team handles it | score -> urgency rubric
// noul   -> needs a human?        | noul -> is it spam?
export const TRIAGE_QUESTIONS: Record<string, QuestionSpec> = {
  department: {
    type: "choice",
    instructions: "Which team should handle this customer support message?",
    criteria: {
      billing: "Charges, invoices, refunds, payment methods, pricing",
      shipping: "Delivery status, delays, lost or missing packages, tracking",
      returns: "Exchanges, refunds or replacements for items already received",
      technical: "Login problems, errors, bugs, crashes, broken features",
      account: "Profile changes, subscriptions, cancellations, general questions",
    },
  },
  urgency: {
    type: "score",
    instructions: "How urgent is this customer support message?",
    criteria: [
      "Informational question, no time pressure",
      "Minor inconvenience, resolution expected this week",
      "Serious problem actively blocking the customer",
      "Critical: money lost, service down, or legal risk",
    ],
  },
  escalate: {
    type: "noul",
    instructions:
      "Does this message need a human to answer personally, rather than an automated reply?",
  },
  spam: {
    type: "noul",
    instructions:
      "Is this message spam, a promotion or a scam instead of a real support request?",
  },
};
