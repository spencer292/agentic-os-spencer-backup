const assert = require("node:assert/strict");
const test = require("node:test");

// The recall dispatcher. decideAndRun is dependency-injected, so we
// drive the decision with a fake `runPrimary` (returns a chosen
// { code, stdout, stderr }) and no real store. The contract is:
//   0 -> valid answer (even empty)       -> print
//   3 -> backend unavailable             -> propagate with setup guidance
//   1 -> scope / usage / isolation error -> propagate
const { decideAndRun, parseArgs } = require("../../../scripts/memory-recall.cjs");

const noop = () => {};

test("recall: a working backend prints results", () => {
  let primaryCalls = 0;
  const code = decideAndRun({
    flags: { query: "scope", passthrough: ["scope", "--system"] },
    env: {},
    runPrimary: () => {
      primaryCalls += 1;
      return { code: 0, stdout: "1. context/MEMORY.md\n", stderr: "" };
    },
    out: noop,
    err: noop,
  });
  assert.equal(code, 0);
  assert.equal(primaryCalls, 1);
});

test("recall: an unavailable backend (exit 3) propagates with setup guidance", () => {
  let warning = "";
  const code = decideAndRun({
    flags: { query: "scope", passthrough: ["scope", "--system"] },
    env: {},
    runPrimary: () => ({ code: 3, stdout: "", stderr: "memory-search failed: cannot open store\n" }),
    out: noop,
    err: (s) => {
      warning += s;
    },
  });
  assert.equal(code, 3);
  assert.match(warning, /setup-memory/);
});

test("recall: MEMORY_BACKEND=memsearch warns that the legacy backend was removed", () => {
  let primaryCalls = 0;
  let warning = "";
  const code = decideAndRun({
    flags: { query: "scope", passthrough: ["scope", "--system"] },
    env: { MEMORY_BACKEND: "memsearch" },
    runPrimary: () => {
      primaryCalls += 1;
      return { code: 0, stdout: "", stderr: "" };
    },
    out: noop,
    err: (s) => {
      warning += s;
    },
  });
  assert.equal(primaryCalls, 0, "the backend must not open for the removed legacy selector");
  assert.equal(code, 2);
  assert.match(warning, /removed/);
});

test("recall: --backend memsearch wins over MEMORY_BACKEND=pglite and errors", () => {
  let primaryCalls = 0;
  const code = decideAndRun({
    flags: { backend: "memsearch", query: "scope", passthrough: ["scope", "--system"] },
    env: { MEMORY_BACKEND: "pglite" },
    runPrimary: () => {
      primaryCalls += 1;
      return { code: 0, stdout: "", stderr: "" };
    },
    out: noop,
    err: noop,
  });
  assert.equal(primaryCalls, 0);
  assert.equal(code, 2, "the explicit flag wins over the env default but is no longer supported");
});

test("recall: a scope/usage error (exit 1) propagates", () => {
  const code = decideAndRun({
    flags: { query: "", passthrough: [] }, // no scope → memory-search.cjs exits 1
    env: {},
    runPrimary: () => ({ code: 1, stdout: "", stderr: "explicit search scope required\n" }),
    out: noop,
    err: noop,
  });
  assert.equal(code, 1, "the error code must propagate unchanged");
});

test("recall: an empty result from a working backend is passed through", () => {
  let printed = "";
  const code = decideAndRun({
    flags: { query: "nothing here", passthrough: ["nothing here", "--system"] },
    env: {},
    runPrimary: () => ({ code: 0, stdout: "  (no matches in scope)\n", stderr: "" }),
    out: (s) => {
      printed += s;
    },
    err: noop,
  });
  assert.equal(code, 0);
  assert.ok(printed.includes("no matches"), "the empty result reaches stdout");
});

test("recall: an invalid --backend value errors and runs nothing", () => {
  let primaryCalls = 0;
  const code = decideAndRun({
    flags: { backend: "milvus", query: "scope", passthrough: ["scope", "--system"] },
    env: {},
    runPrimary: () => {
      primaryCalls += 1;
      return { code: 0 };
    },
    out: noop,
    err: noop,
  });
  assert.equal(code, 1);
  assert.equal(primaryCalls, 0);
});

// ── parseArgs: rung selection ────────────────────────────────────────────────

test("parseArgs: defaults to the search rung when neither --expand nor --transcript is given", () => {
  const flags = parseArgs(["query text", "--system"]);
  assert.equal(flags.rung, "search");
  assert.equal(flags.rungChunkId, undefined);
  assert.equal(flags.bothGiven, false);
});

test("parseArgs: --expand <chunk-id> sets rung to expand and captures the chunk id", () => {
  const flags = parseArgs(["--expand", "chunk-123", "--system"]);
  assert.equal(flags.rung, "expand");
  assert.equal(flags.rungChunkId, "chunk-123");
  assert.equal(flags.bothGiven, false);
  // --expand and its value are consumed, not forwarded as passthrough.
  assert.ok(!flags.passthrough.includes("--expand"));
  assert.ok(!flags.passthrough.includes("chunk-123"));
});

test("parseArgs: --transcript <chunk-id> sets rung to transcript and captures the chunk id", () => {
  const flags = parseArgs(["--transcript", "chunk-456", "--client", "acme"]);
  assert.equal(flags.rung, "transcript");
  assert.equal(flags.rungChunkId, "chunk-456");
  assert.equal(flags.bothGiven, false);
  assert.ok(!flags.passthrough.includes("--transcript"));
  assert.ok(!flags.passthrough.includes("chunk-456"));
});

test("parseArgs: both --expand and --transcript given sets bothGiven", () => {
  const flags = parseArgs(["--expand", "chunk-1", "--transcript", "chunk-2", "--system"]);
  assert.equal(flags.bothGiven, true);
});

test("decideAndRun: --expand and --transcript together is rejected as mutually exclusive (exit 1)", () => {
  let primaryCalls = 0;
  let warning = "";
  const code = decideAndRun({
    flags: { bothGiven: true, query: "", passthrough: [] },
    env: {},
    runPrimary: () => {
      primaryCalls += 1;
      return { code: 0, stdout: "", stderr: "" };
    },
    out: noop,
    err: (s) => {
      warning += s;
    },
  });
  assert.equal(code, 1);
  assert.equal(primaryCalls, 0, "runPrimary must not be called when both flags are given");
  assert.match(warning, /mutually exclusive/);
});

// ── runPrimary: script selection per rung ───────────────────────────────────
//
// Exercised through decideAndRun's injected runPrimary callback (same DI style
// as above); we assert on the `rung` it passes through, mirroring how the real
// main() maps rung -> script.

test("decideAndRun: rung 'expand' is passed through to runPrimary so it dispatches to memory-expand.cjs", () => {
  let seenRung;
  let seenArgs;
  const code = decideAndRun({
    flags: {
      rung: "expand",
      rungChunkId: "chunk-123",
      query: "",
      passthrough: ["--system"],
    },
    env: {},
    runPrimary: (args, rung) => {
      seenRung = rung;
      seenArgs = args;
      return { code: 0, stdout: "", stderr: "" };
    },
    out: noop,
    err: noop,
  });
  assert.equal(code, 0);
  assert.equal(seenRung, "expand");
  assert.deepEqual(seenArgs, ["chunk-123", "--system"]);
});

test("decideAndRun: rung 'transcript' is passed through to runPrimary so it dispatches to memory-transcript.cjs", () => {
  let seenRung;
  let seenArgs;
  const code = decideAndRun({
    flags: {
      rung: "transcript",
      rungChunkId: "chunk-456",
      query: "",
      passthrough: ["--client", "acme"],
    },
    env: {},
    runPrimary: (args, rung) => {
      seenRung = rung;
      seenArgs = args;
      return { code: 0, stdout: "", stderr: "" };
    },
    out: noop,
    err: noop,
  });
  assert.equal(code, 0);
  assert.equal(seenRung, "transcript");
  assert.deepEqual(seenArgs, ["chunk-456", "--client", "acme"]);
});

test("runPrimary: dispatches to the script matching the rung (expand -> memory-expand.cjs, transcript -> memory-transcript.cjs, search -> memory-search.cjs)", () => {
  const { runPrimary } = require("../../../scripts/memory-recall.cjs");
  // runPrimary spawns `node <script> ...args`. Point each rung at a distinct
  // nonexistent path and read back which path Node failed to find from stderr —
  // enough to prove the rung -> script mapping without spawning the real CLIs.
  const scripts = {
    searchScript: "/nonexistent/memory-search.cjs",
    expandScript: "/nonexistent/memory-expand.cjs",
    transcriptScript: "/nonexistent/memory-transcript.cjs",
  };

  const searchResult = runPrimary(["--system"], "search", scripts);
  assert.match(searchResult.stderr, /memory-search\.cjs/);

  const expandResult = runPrimary(["chunk-1", "--system"], "expand", scripts);
  assert.match(expandResult.stderr, /memory-expand\.cjs/);

  const transcriptResult = runPrimary(["chunk-2", "--system"], "transcript", scripts);
  assert.match(transcriptResult.stderr, /memory-transcript\.cjs/);
});
