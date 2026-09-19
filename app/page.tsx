"use client";

import { useEffect, useMemo, useState } from "react";

type Lane = "human" | "agent" | "archive";

interface TriageResult {
  id: string;
  subject: string;
  text: string;
  department: {
    choice: string;
    confidence: number;
    probabilities: Record<string, number>;
  };
  urgency: { score: number; confidence: number };
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

interface Summary {
  count: number;
  avgLatencyMs: number;
  medianLatencyMs: number;
  inputTokens: number;
  costUsd: number;
}

const LANE_META: Record<
  Lane,
  { label: string; hint: string; dot: string; badge: string }
> = {
  human: {
    label: "Human queue",
    hint: "Urgent or escalations. A person answers",
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
  },
  agent: {
    label: "Agent drafts",
    hint: "Medium urgency. An LLM drafts a reply for review",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  archive: {
    label: "Archived",
    hint: "Low urgency or spam. FAQ auto-reply or ignored",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

const DEPT_COLORS: Record<string, string> = {
  billing: "bg-violet-100 text-violet-700",
  shipping: "bg-sky-100 text-sky-700",
  returns: "bg-emerald-100 text-emerald-700",
  technical: "bg-orange-100 text-orange-700",
  account: "bg-indigo-100 text-indigo-700",
};

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-xl font-semibold text-slate-900">{value}</p>
      {sub ? <p className="text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

// One compact line per ticket. Everything else lives in the side panel, so a
// full queue stays on one screen.
function TicketRow({
  r,
  selected,
  onSelect,
}: {
  r: TriageResult;
  selected: boolean;
  onSelect: () => void;
}) {
  const deptColor = DEPT_COLORS[r.department.choice] ?? "bg-slate-100 text-slate-600";

  if (r.error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
        <span className="font-medium">{r.id}</span> · {r.error}
      </div>
    );
  }

  return (
    <button
      data-testid="ticket-card"
      data-lane={r.lane}
      onClick={onSelect}
      className={`w-full rounded-lg border px-3 py-2 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40 ${
        selected
          ? "border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-200"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-2">
        <p className="flex-1 truncate text-sm font-medium text-slate-900">
          {r.subject}
        </p>
        <span className="shrink-0 text-[11px] text-slate-400">
          {r.latencyMs} ms
        </span>
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-[11px]">
        <span className={`rounded-full px-1.5 py-0.5 font-medium ${deptColor}`}>
          {r.department.choice}
        </span>
        <span className="whitespace-nowrap text-slate-500">
          urgency {r.urgency.score.toFixed(1)}
        </span>
        {r.spam >= 0.5 ? (
          <span className="whitespace-nowrap text-slate-500">
            · spam {pct(r.spam)}
          </span>
        ) : null}
      </div>
      <div className="mt-1.5 h-1 w-full rounded-full bg-slate-100">
        <div
          className="h-1 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500"
          style={{ width: `${Math.min(100, (r.urgency.score / 3) * 100)}%` }}
        />
      </div>
    </button>
  );
}

// Side panel: the full ticket and every number Jev returned.
function DetailPanel({ r, onClose }: { r: TriageResult; onClose: () => void }) {
  const meta = LANE_META[r.lane];
  return (
    <aside
      data-testid="ticket-panel"
      className="fixed inset-y-0 right-0 z-20 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <p className="text-xs text-slate-400">{r.id}</p>
          <p className="text-sm font-semibold text-slate-900">{r.subject}</p>
          <span
            className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.badge}`}
          >
            {meta.label} · {r.reason}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close details"
          className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs text-slate-600">
        <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
          {r.text}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-200 p-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Team
            </p>
            <p className="text-sm font-medium text-slate-900">
              {r.department.choice}
            </p>
            <p className="text-[11px] text-slate-500">
              {pct(r.department.confidence)} confident
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Urgency
            </p>
            <p className="text-sm font-medium text-slate-900">
              {r.urgency.score.toFixed(1)} / 3
            </p>
            <p className="text-[11px] text-slate-500">
              human {pct(r.escalate)} · spam {pct(r.spam)}
            </p>
          </div>
        </div>

        {Object.keys(r.department.probabilities).length > 0 ? (
          <div className="space-y-1">
            <p className="font-medium text-slate-800">Team odds</p>
            {Object.entries(r.department.probabilities)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="w-16">{k}</span>
                  <div className="h-1 flex-1 rounded bg-slate-200">
                    <div
                      className="h-1 rounded bg-indigo-400"
                      style={{ width: `${v * 100}%` }}
                    />
                  </div>
                  <span className="w-9 text-right">{pct(v)}</span>
                </div>
              ))}
          </div>
        ) : null}

        {r.draft ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="font-medium text-amber-800">
              Draft reply · {r.draft.engine}
            </p>
            <p className="mt-1 leading-relaxed text-amber-900">{r.draft.text}</p>
          </div>
        ) : null}

        <p className="text-[11px] text-slate-400">
          {r.latencyMs} ms · {r.inputTokens} input tokens · $
          {r.costUsd.toFixed(6)}
        </p>
      </div>
    </aside>
  );
}

export default function Home() {
  const [results, setResults] = useState<TriageResult[]>([]);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<string>("");
  const [customSubject, setCustomSubject] = useState("");
  const [customText, setCustomText] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedLanes, setExpandedLanes] = useState<Record<Lane, boolean>>({
    human: false,
    agent: false,
    archive: false,
  });
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetch("/api/backend")
      .then((r) => r.json())
      .then((d) => setHasKey(Boolean(d.hasTypesafe)))
      .catch(() => setHasKey(false));
  }, []);

  async function run(body: Record<string, unknown>, runMode: string) {
    setLoading(true);
    setError("");
    setMode(runMode);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Request failed");
      const incoming: TriageResult[] = data.results;
      // Custom tickets join the queue. A seed run refreshes the seed tickets
      // and keeps any custom ones already on the board.
      setResults((prev) =>
        runMode === "custom"
          ? [...incoming, ...prev]
          : [...prev.filter((r) => r.id.startsWith("TCK-YOU")), ...incoming]
      );
      if (runMode === "custom") {
        setCustomSubject("");
        setCustomText("");
        setSelectedId(incoming[0]?.id ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
      setMode("");
    }
  }

  const lanes = useMemo(() => {
    const byLane: Record<Lane, TriageResult[]> = {
      human: [],
      agent: [],
      archive: [],
    };
    for (const r of results) byLane[r.lane].push(r);
    for (const lane of Object.keys(byLane) as Lane[]) {
      byLane[lane].sort((a, b) => b.urgency.score - a.urgency.score);
    }
    return byLane;
  }, [results]);

  // Stats cover everything currently on the board.
  const summary = useMemo<Summary | null>(() => {
    if (results.length === 0) return null;
    const latencies = results.map((r) => r.latencyMs).sort((a, b) => a - b);
    const total = latencies.reduce((a, b) => a + b, 0);
    return {
      count: results.length,
      avgLatencyMs: Math.round(total / results.length),
      medianLatencyMs: latencies[Math.floor(latencies.length / 2)],
      inputTokens: results.reduce((a, r) => a + r.inputTokens, 0),
      costUsd: results.reduce((a, r) => a + r.costUsd, 0),
    };
  }, [results]);

  // Rows shown per lane before "Show all".
  const PREVIEW = 4;

  const selected = results.find((r) => r.id === selectedId) ?? null;

  return (
    <main
      className={`mx-auto max-w-6xl px-4 py-6 transition-[padding] duration-200 ${
        selected ? "lg:pr-[30rem]" : ""
      }`}
    >
      {/* header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Triage Desk
          </h1>
          <p className="text-sm text-slate-500">
            Jev-powered support triage. Schema in, typed decisions out, one
            call per ticket.
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            hasKey === false
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {hasKey === null
            ? "loading…"
            : hasKey
              ? "JEV · typesafe.ai live"
              : "TYPESAFE_API_KEY missing"}
        </span>
      </header>

      {/* controls */}
      <section className="mt-6 flex flex-wrap items-center gap-2">
        <button
          disabled={loading}
          onClick={() => run({ mode: "seed" }, "seed")}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {mode === "seed" && loading ? "Triaging…" : "Triage seed queue (20)"}
        </button>
        {results.length > 0 ? (
          <button
            onClick={() => {
              setResults([]);
              setSelectedId(null);
            }}
            className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:text-slate-800"
          >
            Clear
          </button>
        ) : null}
        {hasKey === false ? (
          <p className="w-full text-xs text-rose-500">
            Add TYPESAFE_API_KEY to .env and restart the server.
          </p>
        ) : null}
      </section>

      {/* custom ticket */}
      <section className="mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <p className="text-sm font-medium text-slate-800">
          Triage your own ticket
        </p>
        <div className="mt-2 flex flex-col gap-2">
          <input
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            placeholder="Subject (optional)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Paste the customer message here…"
            rows={2}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
          <div>
            <button
              disabled={loading || !customText.trim()}
              onClick={() =>
                run(
                  { mode: "custom", subject: customSubject, text: customText },
                  "custom"
                )
              }
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {mode === "custom" && loading ? "Triaging…" : "Triage this ticket"}
            </button>
          </div>
        </div>
        {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
      </section>

      {/* stats */}
      {summary ? (
        <section
          data-testid="stats"
          className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          <Stat label="Tickets triaged" value={String(summary.count)} />
          <Stat
            label="Median latency"
            value={`${summary.medianLatencyMs} ms`}
            sub={`avg ${summary.avgLatencyMs} ms`}
          />
          <Stat
            label="Input tokens"
            value={summary.inputTokens.toLocaleString()}
            sub="output tokens: free"
          />
          <Stat
            label="Total cost"
            value={`$${summary.costUsd.toFixed(4)}`}
            sub="@ $0.042 / 1M input tokens"
          />
        </section>
      ) : null}

      {/* board */}
      {results.length > 0 ? (
        <section className="mt-4 grid gap-4 lg:grid-cols-3">
          {(Object.keys(LANE_META) as Lane[]).map((lane) => {
            const meta = LANE_META[lane];
            const items = lanes[lane];
            const expanded = expandedLanes[lane];
            const shown = expanded ? items : items.slice(0, PREVIEW);
            return (
              <div key={lane}>
                <div className="mb-1 flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                  <h2 className="text-sm font-semibold text-slate-900">
                    {meta.label}{" "}
                    <span className="font-normal text-slate-400">
                      ({items.length})
                    </span>
                  </h2>
                </div>
                <p className="mb-2 text-xs text-slate-400">{meta.hint}</p>
                <div className="space-y-2">
                  {shown.map((r) => (
                    <TicketRow
                      key={r.id}
                      r={r}
                      selected={r.id === selectedId}
                      onSelect={() => setSelectedId(r.id)}
                    />
                  ))}
                  {items.length > PREVIEW ? (
                    <button
                      onClick={() =>
                        setExpandedLanes((prev) => ({
                          ...prev,
                          [lane]: !prev[lane],
                        }))
                      }
                      className="w-full rounded-lg border border-dashed border-slate-300 py-1.5 text-xs text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                    >
                      {expanded
                        ? "Show less"
                        : `Show all (${items.length})`}
                    </button>
                  ) : null}
                  {items.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 py-3 text-center text-xs text-slate-300">
                      empty
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        <section className="mt-10 rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
          {loading
            ? "Triaging queue…"
            : "Run the seed queue to watch the traffic cop sort tickets into lanes."}
        </section>
      )}

      <footer className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-400">
        One Jev call per ticket answers four typed questions in parallel:
        department (choice), urgency (score), needs-human (noul), spam (noul).
      </footer>
      {selected ? (
        <DetailPanel r={selected} onClose={() => setSelectedId(null)} />
      ) : null}
    </main>
  );
}
