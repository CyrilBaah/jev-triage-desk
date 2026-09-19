# Triage Desk: Jev-powered support triage

Support queues are expensive because every incoming message needs a decision:
what is it, how urgent is it, and who handles it. Triage Desk puts
[Jev](https://typesafe.ai), TypeSafe AI's System One decision model, at the
front of that queue as a traffic cop.

One API call per ticket answers four typed questions in parallel. In our runs
that took about 400ms median per ticket, at roughly 540 input tokens each:

| Question | Jev type | Example answer |
| --- | --- | --- |
| Which team handles it? | `choice` | `billing` @ 87% |
| How urgent is it? | `score` | `2.3 / 3` |
| Needs a human? | `noul` | `0.92` |
| Is it spam? | `noul` | `0.04` |

No text is generated, so there is nothing to parse. The answers arrive typed
and drop straight into routing logic:

- 🔴 **Human queue:** high urgency or escalation probability
- 🟡 **Agent drafts:** medium urgency, an LLM (Groq) drafts a reply for review
- ⚪ **Archived:** low urgency or spam, FAQ auto-reply or ignored

## Keys

The app needs two keys, set in `.env`:

| Key | What it does |
| --- | --- |
| `TYPESAFE_API_KEY` | Real Jev through the direct API (`api.typesafe.ai/v1/systemone`). Get one at [console.typesafe.ai](https://console.typesafe.ai/settings/keys) |
| `GROQ_API_KEY` | Drafts replies for agent-lane tickets with `openai/gpt-oss-20b`. Free tier, get one at [console.groq.com](https://console.groq.com/keys) |

If the Groq call fails, agent-lane tickets get a fixed template reply.

## Run it

```bash
cd jev-triage-desk
npm install
cp .env.example .env   # paste your TYPESAFE_API_KEY and GROQ_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Step 1:** Click **Triage seed queue (20)** and watch the lanes fill up.

**Step 2:** Paste your own ticket in the composer and triage it (see the
examples below).

Tickets in the agent lane get a reply drafted by Groq.

## Triage your own tickets

Use the **Triage your own ticket** box on the dashboard: add an optional
subject, paste the customer message, and hit triage. Here are some examples to
try, one for each lane.

**Human queue** (legal threat, high urgency):

> **Subject:** Unauthorized charge
>
> There is a $249 charge on my card I never made. If it is not reversed by
> Friday I am contacting my bank and a lawyer.

**Agent drafts** (a real problem, but routine):

> **Subject:** App crashes on upload
>
> The app crashes whenever I upload files larger than 20MB. It started after
> the last update and I use it daily.

**Archived** (simple question, no time pressure):

> **Subject:** Changing my card
>
> Quick question, how do I update the card on my subscription before next
> month's billing? No rush.

**Archived as spam:**

> **Subject:** You won!
>
> Congratulations, you are today's winner. Click here to claim your free
> crypto prize. Limited time, act now!

You can also call the API directly:

```bash
curl -X POST http://localhost:3000/api/triage \
  -H "Content-Type: application/json" \
  -d '{"mode":"custom","subject":"App crashes on upload","text":"The app crashes whenever I upload files larger than 20MB."}'
```

## Project layout

```
lib/jev/          # Jev client layer: direct API, cost/latency metering
lib/jev/questions.ts  # the four-question triage schema (the heart of the app)
lib/router.ts     # thresholds that turn probabilities into lanes
lib/agent.ts      # Groq reply drafting for the agent lane
lib/tickets.ts    # 20 realistic seed tickets
app/api/triage/   # POST endpoint that runs the queue with a small worker pool
app/page.tsx      # the dashboard
```

## Tune it

The lane split lives in `lib/router.ts`. Adjust `THRESHOLDS` to move the
human/automation boundary. The schema lives in `lib/jev/questions.ts`. Add a
fifth question (for example, sentiment) and Jev answers it in the same call.

## License

MIT
