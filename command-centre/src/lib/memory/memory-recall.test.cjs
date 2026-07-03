const assert = require("node:assert/strict");
const test = require("node:test");

// The recall dispatcher. decideAndRun is dependency-injected, so we
// drive the decision with a fake `runPrimary` (returns a chosen
// { code, stdout, stderr }) and no real store. The contract is:
//   0 -> valid answer (even empty)       -> print
//   3 -> backend unavailable             -> propagate with setup guidance
//   1 -> scope / usage / isolation error -> propagate
const { decideAndRun } = require("../../../scripts/memory-recall.cjs");

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
