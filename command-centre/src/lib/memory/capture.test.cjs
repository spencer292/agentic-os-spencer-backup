const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { loadTsModule } = require("../test-utils/load-ts-module.cjs");

// Leaf-first loading, same as indexer.test.cjs. capture.ts value-imports only
// ./indexer (the rest are type-only and erased), so it is loaded with that one
// stub. Stays fully OFFLINE — HashEmbedder is constructed directly.
const types = { ALL_VISIBILITIES: ["private", "client", "team", "system"] };
const embedding = loadTsModule(path.resolve(__dirname, "embedding.ts"));
const scope = loadTsModule(path.resolve(__dirname, "scope.ts"), {
  stubs: { "./types": types },
});
const migrate = loadTsModule(path.resolve(__dirname, "migrate.ts"));
const adapter = loadTsModule(path.resolve(__dirname, "pglite-adapter.ts"));
const postgresAdapter = loadTsModule(path.resolve(__dirname, "postgres-adapter.ts"));
const backend = loadTsModule(path.resolve(__dirname, "backend.ts"));
const rowMappers = loadTsModule(path.resolve(__dirname, "row-mappers.ts"), {
  stubs: { "./types": types, "./embedding": embedding },
});
const store = loadTsModule(path.resolve(__dirname, "store.ts"), {
  stubs: {
    "./types": types,
    "./migrate": migrate,
    "./scope": scope,
    "./embedding": embedding,
    "./row-mappers": rowMappers,
    "./pglite-adapter": adapter,
    "./postgres-adapter": postgresAdapter,
    "./backend": backend,
  },
});
const embedder = loadTsModule(path.resolve(__dirname, "embedder.ts"));
const chunker = loadTsModule(path.resolve(__dirname, "chunker.ts"));
const discovery = loadTsModule(path.resolve(__dirname, "discovery.ts"));
const ingest = loadTsModule(path.resolve(__dirname, "ingest.ts"), {
  stubs: { "./scope": scope, "./embedding": embedding, "./chunker": chunker },
});
const indexer = loadTsModule(path.resolve(__dirname, "indexer.ts"), {
  stubs: { "./scope": scope, "./ingest": ingest, "./discovery": discovery },
});
const capture = loadTsModule(path.resolve(__dirname, "capture.ts"), {
  stubs: { "./indexer": indexer },
});

const EMBED_DIM = 8;

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aios-cap-"));
}
function rmDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}
function sysScope(overrides = {}) {
  return { teamId: null, clientId: null, userId: null, visibility: "system", ...overrides };
}
function newEmbedder() {
  return new embedder.HashEmbedder({ dim: EMBED_DIM });
}
// Local-time date so the .aos.md filename matches across timezones.
const NOW = new Date(2026, 5, 7, 12, 0, 0);
const TODAY = "2026-06-07";

function writeTranscript(dir, entries) {
  const file = path.join(dir, "transcript.jsonl");
  fs.writeFileSync(file, entries.map((e) => JSON.stringify(e)).join("\n") + "\n");
  return file;
}

// ---------------------------------------------------------------------------
// extractLastTurn
// ---------------------------------------------------------------------------

test("extractLastTurn pulls the last user→assistant exchange, skipping tool results", () => {
  const dir = tempDir();
  try {
    const file = writeTranscript(dir, [
      { type: "user", uuid: "u0", message: { role: "user", content: "first question" } },
      { type: "assistant", uuid: "a0", message: { role: "assistant", content: [{ type: "text", text: "first answer" }] } },
      { type: "user", uuid: "u1", message: { role: "user", content: [{ type: "text", text: "what is the capital of France?" }] } },
      // A tool_result user turn must NOT be treated as the prompt.
      { type: "user", uuid: "tr", message: { role: "user", content: [{ type: "tool_result", content: "ignored" }] } },
      { type: "assistant", uuid: "a1", message: { role: "assistant", content: [{ type: "text", text: "The capital of France is Paris." }] } },
    ]);
    const turn = capture.extractLastTurn(file);
    assert.ok(turn);
    assert.equal(turn.assistantMessage, "The capital of France is Paris.");
    assert.equal(turn.userPrompt, "what is the capital of France?");
    assert.equal(turn.turnId, "a1"); // from the assistant entry uuid
  } finally {
    rmDir(dir);
  }
});

test("extractLastTurn returns null on missing or contentless transcripts", () => {
  const dir = tempDir();
  try {
    assert.equal(capture.extractLastTurn(path.join(dir, "nope.jsonl")), null);
    // Corrupt + no assistant text → null, never throws.
    const corrupt = path.join(dir, "corrupt.jsonl");
    fs.writeFileSync(corrupt, "{not json\n{\"type\":\"user\",\"message\":{\"role\":\"user\",\"content\":\"hi\"}}\n");
    assert.equal(capture.extractLastTurn(corrupt), null);
  } finally {
    rmDir(dir);
  }
});

// ---------------------------------------------------------------------------
// upsertSessionCapture
// ---------------------------------------------------------------------------

test("upsertSessionCapture writes one summarized block and is idempotent by source hash", () => {
  const root = tempDir();
  try {
    const turn = { userPrompt: "hello", assistantMessage: "raw answer that should not be stored", turnId: "t1" };
    const summaryText = "- User asked for a greeting.\n- Claude answered with a short summary.";
    const r1 = capture.upsertSessionCapture({ rootDir: root, sessionId: "s1", turn, summaryText, now: NOW });
    assert.equal(r1.written, true);
    assert.ok(r1.filePath.endsWith(path.join("context", "memory", `${TODAY}.aos.md`)));
    const after1 = fs.readFileSync(r1.filePath, "utf-8");
    assert.match(after1, /## Auto-capture \(machine-owned/);
    assert.ok(after1.includes(summaryText));
    assert.ok(!after1.includes("raw answer that should not be stored"));

    // Same source turn again -> no write, even if the runtime turn id differs.
    const r2 = capture.upsertSessionCapture({
      rootDir: root,
      sessionId: "s1",
      turn: { ...turn, turnId: "t1-replayed" },
      summaryText,
      now: NOW,
    });
    assert.equal(r2.written, false);
    const after2 = fs.readFileSync(r2.filePath, "utf-8");
    assert.equal(after2, after1);
    assert.equal((after2.match(/aos-capture session:s1 source:/g) || []).length, 1);
  } finally {
    rmDir(root);
  }
});

test("upsertSessionCapture appends new turns in the same session", () => {
  const root = tempDir();
  try {
    capture.upsertSessionCapture({
      rootDir: root, sessionId: "s1", now: NOW,
      turn: { userPrompt: "q1", assistantMessage: "answer one", turnId: "t1" },
      summaryText: "- User asked q1.\n- Claude answered one.",
    });
    const r = capture.upsertSessionCapture({
      rootDir: root, sessionId: "s1", now: NOW,
      turn: { userPrompt: "q2", assistantMessage: "answer two", turnId: "t2" },
      summaryText: "- User asked q2.\n- Claude answered two.",
    });
    assert.equal(r.written, true);
    const text = fs.readFileSync(r.filePath, "utf-8");
    assert.equal((text.match(/aos-capture session:s1 source:/g) || []).length, 2);
    assert.ok(text.includes("Claude answered one."));
    assert.ok(text.includes("Claude answered two."));
  } finally {
    rmDir(root);
  }
});

test("upsertSessionCapture writes nothing for an empty assistant message", () => {
  const root = tempDir();
  try {
    const r = capture.upsertSessionCapture({
      rootDir: root, sessionId: "s1", now: NOW,
      turn: { userPrompt: "q", assistantMessage: "   ", turnId: "t1" },
    });
    assert.equal(r.written, false);
    assert.equal(typeof r.sourceHash, "string");
    assert.equal(fs.existsSync(r.filePath), false);
  } finally {
    rmDir(root);
  }
});

test("archiveRawTranscript copies the source transcript once", () => {
  const root = tempDir();
  const transcriptDir = tempDir();
  try {
    const transcript = writeTranscript(transcriptDir, [
      { type: "user", uuid: "u1", message: { role: "user", content: "archive this" } },
      { type: "assistant", uuid: "a1", message: { role: "assistant", content: [{ type: "text", text: "archived answer" }] } },
    ]);
    const turn = capture.extractLastTurn(transcript);
    const r1 = capture.archiveRawTranscript({
      rootDir: root,
      transcriptPath: transcript,
      sessionId: "session one",
      turn,
      now: NOW,
    });
    assert.equal(r1.written, true);
    assert.ok(r1.relativePath.startsWith(`context/transcripts/${TODAY}/session-one-`));
    assert.equal(fs.readFileSync(r1.filePath, "utf-8"), fs.readFileSync(transcript, "utf-8"));

    const r2 = capture.archiveRawTranscript({
      rootDir: root,
      transcriptPath: transcript,
      sessionId: "session one",
      turn,
      now: NOW,
    });
    assert.equal(r2.written, false);
    assert.equal(r2.filePath, r1.filePath);
  } finally {
    rmDir(root);
    rmDir(transcriptDir);
  }
});

test("captureSessionTurn uses summaries and records the raw transcript archive", async () => {
  const root = tempDir();
  const transcriptDir = tempDir();
  try {
    const transcript = writeTranscript(transcriptDir, [
      { type: "user", uuid: "u1", message: { role: "user", content: "summarize this turn" } },
      { type: "assistant", uuid: "a1", message: { role: "assistant", content: [{ type: "text", text: "raw answer not persisted" }] } },
    ]);
    const turn = capture.extractLastTurn(transcript);
    let summaryCalls = 0;
    const r = await capture.captureSessionTurn({
      rootDir: root,
      sessionId: "s-summary",
      transcriptPath: transcript,
      turn,
      now: NOW,
      summaryConfig: { enabled: true, provider: "claude", model: "haiku", timeoutMs: 100 },
      summaryRunner: async () => {
        summaryCalls += 1;
        return "- User asked to summarize a turn.\n- Claude captured a compact memory.";
      },
    });

    assert.equal(r.written, true);
    assert.equal(r.summarySource, "summarized");
    assert.equal(summaryCalls, 1);
    assert.equal(r.rawTranscriptWritten, true);
    const text = fs.readFileSync(r.filePath, "utf-8");
    assert.ok(text.includes("Claude captured a compact memory."));
    assert.ok(text.includes(`Raw transcript: \`${r.rawTranscriptPath}\``));
    assert.ok(!text.includes("raw answer not persisted"));

    const replay = await capture.captureSessionTurn({
      rootDir: root,
      sessionId: "s-summary",
      transcriptPath: transcript,
      turn,
      now: NOW,
      summaryConfig: { enabled: true, provider: "claude", model: "haiku", timeoutMs: 100 },
      summaryRunner: async () => {
        summaryCalls += 1;
        return "- This should not run.";
      },
    });
    assert.equal(replay.written, false);
    assert.equal(replay.summarySource, "skipped");
    assert.equal(summaryCalls, 1);
  } finally {
    rmDir(root);
    rmDir(transcriptDir);
  }
});

test("captureSessionTurn falls back when summarization fails", async () => {
  const root = tempDir();
  try {
    const turn = {
      userPrompt: "what happened?",
      assistantMessage: "The assistant explained the fallback path.",
      turnId: "t-fallback",
    };
    const r = await capture.captureSessionTurn({
      rootDir: root,
      sessionId: "s-fallback",
      turn,
      now: NOW,
      summaryConfig: { enabled: true, provider: "claude", model: "haiku", timeoutMs: 100 },
      summaryRunner: async () => null,
    });
    assert.equal(r.written, true);
    assert.equal(r.summarySource, "fallback");
    const text = fs.readFileSync(r.filePath, "utf-8");
    assert.ok(text.includes("- User asked: what happened?"));
    assert.ok(text.includes("- Assistant responded: The assistant explained the fallback path."));
  } finally {
    rmDir(root);
  }
});

// ---------------------------------------------------------------------------
// refreshIndex — debounce + force
// ---------------------------------------------------------------------------

test("refreshIndex debounces, and --force bypasses it", async () => {
  const root = tempDir();
  const stateDir = tempDir();
  const s = await store.openMemoryStore({ embedDim: EMBED_DIM }); // ephemeral
  try {
    const base = NOW.getTime();
    const common = { store: s, embedder: newEmbedder(), scope: sysScope(), rootDir: root, stateDir };

    const run1 = await capture.refreshIndex({ ...common, reason: "session_capture", force: true, now: new Date(base) });
    assert.equal(run1.skipped, null);
    assert.ok(run1.summary);

    // 5s later, within the 30s debounce window → skipped.
    const run2 = await capture.refreshIndex({ ...common, debounceMs: 30_000, now: new Date(base + 5_000) });
    assert.equal(run2.skipped, "debounced");
    assert.equal(run2.summary, null);

    // force bypasses the debounce.
    const run3 = await capture.refreshIndex({ ...common, debounceMs: 30_000, force: true, now: new Date(base + 5_000) });
    assert.equal(run3.skipped, null);

    // State file records the last run.
    const state = JSON.parse(fs.readFileSync(path.join(stateDir, "capture-state.json"), "utf-8"));
    assert.equal(typeof state.lastIndexAt, "number");
  } finally {
    await s.close();
    rmDir(root);
    rmDir(stateDir);
  }
});

// ---------------------------------------------------------------------------
// End-to-end: a captured turn becomes searchable, and status reflects it
// ---------------------------------------------------------------------------

test("a captured session is indexed and searchable, and status reflects it", async () => {
  const root = tempDir();
  const stateDir = tempDir();
  const s = await store.openMemoryStore({ embedDim: EMBED_DIM }); // ephemeral
  try {
    const written = capture.upsertSessionCapture({
      rootDir: root, sessionId: "s9", now: NOW,
      turn: {
        userPrompt: "how does pglite pgvector memory capture work?",
        assistantMessage: "The pglite pgvector memory store indexes the captured session chunk.",
        turnId: "t1",
      },
    });
    assert.equal(written.written, true);

    const refresh = await capture.refreshIndex({
      store: s, embedder: newEmbedder(), scope: sysScope(), rootDir: root,
      stateDir, reason: "session_capture", force: true, now: NOW,
    });
    assert.equal(refresh.summary.errors.length, 0);
    assert.ok(refresh.summary.sourcesIndexed >= 1);

    // The captured text is retrievable via a scoped vector search.
    const [q] = await newEmbedder().embed(["pglite pgvector memory store captured session"]);
    const hits = await s.vectorSearch({ teamId: null, include: ["system"] }, q, 5);
    assert.ok(hits.some((h) => h.content.includes("captured session chunk")));
    assert.ok(hits.some((h) => h.sourcePath === `context/memory/${TODAY}.aos.md`));

    // Status reflects the capture + the index job reason.
    const status = await capture.memoryStatus({ store: s, rootDir: root, now: NOW });
    assert.ok(status.sources >= 1);
    assert.ok(status.chunks >= 1);
    assert.ok((status.byVisibility.system ?? 0) >= 1);
    assert.equal(status.today.capturePresent, true);
    assert.equal(status.today.captureIndexed, true);
    assert.ok(status.lastIndex);
    assert.equal(status.lastIndex.reason, "session_capture");
  } finally {
    await s.close();
    rmDir(root);
    rmDir(stateDir);
  }
});
