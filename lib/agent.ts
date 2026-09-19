// The agent lane: Jev only decides, an LLM does the writing.
// Uses Groq (GROQ_API_KEY); falls back to a template draft if the call fails.

export interface Draft {
  engine: "groq" | "template";
  text: string;
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-20b";

const systemPrompt = (department: string) =>
  `You are a support agent on the ${department} team. Write one short, warm, professional reply (3-4 sentences) to the customer's message. Acknowledge the issue and give the next concrete step. Do not invent refunds or timelines. Output only the reply text.`;

async function draftWithGroq(
  key: string,
  subject: string,
  text: string,
  department: string
): Promise<string | null> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.4,
      // gpt-oss reasons before answering; keep it brief and leave room for
      // the reply itself.
      reasoning_effort: "low",
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt(department) },
        { role: "user", content: `Subject: ${subject}\n\n${text}` },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
}

export async function draftReply(
  subject: string,
  text: string,
  department: string
): Promise<Draft> {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const reply = await draftWithGroq(groqKey, subject, text, department);
      if (reply) return { engine: "groq", text: reply };
    } catch (err) {
      console.error("Groq draft failed:", err);
    }
  }

  return {
    engine: "template",
    text:
      `Hi, thanks for reaching out about "${subject}". ` +
      `Your ticket has been routed to our ${department} team and an agent is drafting a full reply. ` +
      `If anything changes in the meantime, reply to this email and it will stay attached to your case.`,
  };
}
