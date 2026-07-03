const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const parserSourcePath = path.resolve(__dirname, "claude-parser.ts");

function loadParserModule() {
  const source = fs.readFileSync(parserSourcePath, "utf-8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });

  const module = { exports: {} };
  const localRequire = (request) => {
    if (request === "@/types/question-spec") {
      return {
        extractQuestionSpecsFromText: () => null,
        stripQuestionSpecsFromText: (text) => text,
      };
    }
    if (request === "@/types/task") {
      return {};
    }
    return require(request);
  };

  const compiled = new Function("require", "module", "exports", "__dirname", "__filename", outputText);
  compiled(localRequire, module, module.exports, path.dirname(parserSourcePath), parserSourcePath);
  return module.exports;
}

test("ClaudeOutputParser treats is_error result lines as errors", () => {
  const { ClaudeOutputParser } = loadParserModule();
  const completions = [];
  const errors = [];
  const parser = new ClaudeOutputParser({
    onProgress: () => {},
    onComplete: (data) => completions.push(data),
    onError: (message) => errors.push(message),
  });

  parser.feedLine(JSON.stringify({
    type: "result",
    subtype: "success",
    is_error: true,
    api_error_status: 401,
    duration_ms: 3039,
    duration_api_ms: 0,
    num_turns: 0,
  }));

  assert.equal(parser.isCompleted, true);
  assert.equal(completions.length, 0);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Claude returned 401/i);
  assert.match(errors[0], /Refresh your Claude Code login/i);
});
