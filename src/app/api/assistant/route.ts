import { connection } from "next/server";
import { z } from "zod";

// Grounded AI explanations via Groq (OpenAI-compatible API).
// Receives only privacy-safe summaries built on the client — never documents or identifiers.
// Request bodies are not logged.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const FALLBACK_MODEL = "llama-3.3-70b-versatile";

const Payload = z.object({
  question: z.string().min(1).max(600),
  application: z.string().max(300),
  findings: z
    .array(
      z.object({
        id: z.string().max(8),
        title: z.string().max(200),
        status: z.string().max(20),
        severity: z.string().max(20),
        summary: z.string().max(1200),
        basis: z.string().max(20),
        focus: z.boolean(),
      }),
    )
    .max(15),
  passages: z
    .array(z.object({ id: z.string().max(60), title: z.string().max(200), text: z.string().max(2000), confidence: z.string().max(20) }))
    .max(8),
});

// Simple per-instance rate limit; enough to stop accidental loops in a demo.
const hits = new Map<string, number[]>();
function limited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > 20;
}

const SYSTEM = `You are the RejectLess assistant. You help Indian citizens understand problems found while preparing a government application (EPF withdrawals, scholarships) and how to fix them.

Strict rules:
- Use ONLY the PASSAGES and FINDINGS provided. If they do not contain the answer, say you could not verify it and suggest checking the official portal. Never invent requirements, deadlines, form names, fees, URLs or procedures.
- Cite every factual statement with passage ids in square brackets, e.g. [G-TDS]. Only cite ids that appear in PASSAGES.
- Passages with confidence "verify" come from secondary reporting: say the user should confirm on the official portal.
- Never say the application will be approved, accepted or is eligible for sure. Never claim RejectLess verified anything with EPFO, NSP, UIDAI or a bank.
- Findings are produced by deterministic checks. Do not change, re-judge or contradict their status; explain them.
- Use simple, friendly language a first-time applicant understands. Short paragraphs or a numbered list of steps. Under 180 words.
- Reply in the language of the question (Hindi if the question is in Hindi, otherwise English).
- The user's personal details were removed for privacy ([NAME], [NUMBER] etc.). Do not ask for them.

Respond as JSON: {"answer": string, "citations": string[], "followUps": string[] (up to 3 short follow-up questions)}.`;

export async function GET() {
  await connection();
  return Response.json({ enabled: !!process.env.GROQ_API_KEY, provider: "Groq", model: MODEL });
}

export async function POST(req: Request) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return Response.json({ error: "AI answers are not configured on this server." }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return Response.json({ error: "Too many questions in a short time. Please wait a minute." }, { status: 429 });

  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 40_000) return Response.json({ error: "Request too large." }, { status: 413 });

  let body: z.infer<typeof Payload>;
  try {
    body = Payload.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const user = [
    `APPLICATION: ${body.application}`,
    "",
    "FINDINGS (from deterministic checks; focus marked *):",
    ...body.findings.map((f) => `${f.focus ? "*" : "-"} ${f.id} [${f.status}/${f.severity}, basis: ${f.basis}] ${f.title}: ${f.summary}`),
    "",
    "PASSAGES:",
    ...body.passages.map((p) => `[${p.id}] (confidence: ${p.confidence}) ${p.title}: ${p.text}`),
    "",
    `QUESTION: ${body.question}`,
  ].join("\n");

  async function call(model: string) {
    const r = await fetch(GROQ_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_completion_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!r.ok) throw Object.assign(new Error(`Groq ${r.status}`), { status: r.status });
    const data = await r.json();
    return JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as { answer?: string; citations?: string[]; followUps?: string[] };
  }

  try {
    let out;
    try {
      out = await call(MODEL);
    } catch (e) {
      if ((e as { status?: number }).status === 429 || (e as { status?: number }).status === 401) throw e;
      out = await call(FALLBACK_MODEL);
    }
    if (!out.answer) throw new Error("empty");
    return Response.json({
      answer: String(out.answer).slice(0, 4000),
      citations: Array.isArray(out.citations) ? out.citations.map(String).slice(0, 8) : [],
      followUps: Array.isArray(out.followUps) ? out.followUps.map(String).slice(0, 3) : [],
    });
  } catch (e) {
    const status = (e as { status?: number }).status;
    // Error details are not echoed: they could contain request content.
    return Response.json(
      { error: status === 429 ? "The AI service is busy (rate limit). Showing the offline answer instead." : "The AI service is unavailable right now." },
      { status: status === 429 ? 429 : 502 },
    );
  }
}
