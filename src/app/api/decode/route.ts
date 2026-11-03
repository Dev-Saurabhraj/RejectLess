import { z } from "zod";

// AI decoding of a rejection notice via Groq. The client sends the notice text ONLY after
// redaction (names, Aadhaar/PAN/UAN/account/claim numbers, phones, emails, dates → tags) plus
// the catalogue of known reasons, so the model classifies against our knowledge instead of
// inventing rules. Request bodies are not logged.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const FALLBACK_MODEL = "llama-3.3-70b-versatile";

const Payload = z.object({
  application: z.string().max(200),
  notice: z.string().min(10).max(4000),
  known: z.array(z.object({ id: z.string().max(40), title: z.string().max(160), meaning: z.string().max(400) })).max(30),
});

const hits = new Map<string, number[]>();
function limited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > 10;
}

const SYSTEM = `You decode Indian government application rejection notices (EPFO claims, National Scholarship Portal, PM-KISAN, Income Tax) for first-time applicants.

Rules:
- Use ONLY the NOTICE text. Personal details in it were replaced by tags like [NAME], [NUMBER], [PAN], [DATE]; never ask for them or guess them.
- KNOWN REASONS is our verified catalogue. For each problem you find in the notice, set "knownId" to the matching catalogue id, or null if none fits. Prefer a catalogue match over your own wording.
- Never invent rules, deadlines, fees, portals or procedures that are not in the notice or the catalogue. If the notice is unclear, say so in "summary" and keep "reasons" short.
- Plain words a Class-10 reader understands. Hindi in Devanagari, simple and polite.
- Do not say the application will succeed if refiled.

Respond as JSON:
{"summary": string (English, ≤ 60 words), "summaryHi": string (Hindi), "reasons": [{"knownId": string|null, "title": string, "titleHi": string, "meaning": string, "meaningHi": string, "evidence": string (the phrase from the notice), "steps": string[] (≤ 3, only when knownId is null)}], "deadline": string|null (any response deadline stated in the notice, else null), "confidence": "high"|"medium"|"low"}`;

export async function POST(req: Request) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return Response.json({ error: "AI decoding is not configured on this server." }, { status: 503 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return Response.json({ error: "Too many notices in a short time. Please wait a minute." }, { status: 429 });
  let body: z.infer<typeof Payload>;
  try {
    body = Payload.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const user = [
    `APPLICATION: ${body.application}`,
    "",
    "KNOWN REASONS:",
    ...body.known.map((k) => `- ${k.id}: ${k.title} — ${k.meaning}`),
    "",
    "NOTICE:",
    body.notice,
  ].join("\n");

  async function call(model: string) {
    const r = await fetch(GROQ_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_completion_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) throw Object.assign(new Error(`Groq ${r.status}`), { status: r.status });
    const data = await r.json();
    return JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as Record<string, unknown>;
  }

  try {
    let out: Record<string, unknown>;
    try {
      out = await call(MODEL);
    } catch (e) {
      if ((e as { status?: number }).status === 429 || (e as { status?: number }).status === 401) throw e;
      out = await call(FALLBACK_MODEL);
    }
    const knownIds = new Set(body.known.map((k) => k.id));
    const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
    const reasons = (Array.isArray(out.reasons) ? out.reasons : []).slice(0, 6).map((r) => {
      const o = (r ?? {}) as Record<string, unknown>;
      const id = typeof o.knownId === "string" && knownIds.has(o.knownId) ? o.knownId : null;
      return {
        knownId: id,
        title: str(o.title, 160),
        titleHi: str(o.titleHi, 200),
        meaning: str(o.meaning, 600),
        meaningHi: str(o.meaningHi, 800),
        evidence: str(o.evidence, 200),
        steps: Array.isArray(o.steps) ? o.steps.map((s) => str(s, 240)).filter(Boolean).slice(0, 3) : [],
      };
    });
    if (!str(out.summary, 1).length && !reasons.length) throw new Error("empty");
    return Response.json({
      summary: str(out.summary, 600),
      summaryHi: str(out.summaryHi, 800),
      reasons,
      deadline: str(out.deadline, 120) || null,
      confidence: ["high", "medium", "low"].includes(String(out.confidence)) ? String(out.confidence) : "low",
      model: MODEL,
    });
  } catch (e) {
    const status = (e as { status?: number }).status;
    return Response.json({ error: status === 429 ? "The AI service is busy (rate limit). Try again in a minute." : "The AI service is unavailable right now." }, { status: status === 429 ? 429 : 502 });
  }
}
