#!/usr/bin/env node
/**
 * validate-instrument.mjs
 *
 * Validates an emitted scorecard funnel pack before it is handed over.
 *
 * Usage:
 *   node validate-instrument.mjs <pack-directory>
 *
 * The pack directory holds three TypeScript content files:
 *   {slug}.ts           the QuizDefinition
 *   {slug}.landing.ts   the landing copy
 *   {slug}.results.ts   the ResultCopySet
 *
 * They are loaded under plain node using built-in type stripping (Node 22.18+
 * or 23+; verified on Node 24). Type-only imports are erased before the file
 * runs, so the engine import path inside each file never has to resolve here.
 * No framework, no build step, no dependencies beyond node built-ins.
 *
 * Exits 0 when every check passes, 1 on any failure.
 */

import { readdirSync, statSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { pathToFileURL } from "node:url";

const errors = [];
const warnings = [];
const notes = [];

const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);
const note = (msg) => notes.push(msg);

// ---------------------------------------------------------------- arguments

const target = process.argv[2];
if (!target) {
  console.error("Usage: node validate-instrument.mjs <pack-directory>");
  process.exit(1);
}

const dir = resolve(target);
let dirStat;
try {
  dirStat = statSync(dir);
} catch {
  console.error(`Not found: ${dir}`);
  process.exit(1);
}
if (!dirStat.isDirectory()) {
  console.error(`Not a directory: ${dir}`);
  process.exit(1);
}

// ------------------------------------------------------------- file discovery

const tsFiles = readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts"));

const resultsFiles = tsFiles.filter((f) => f.endsWith(".results.ts"));
const landingFiles = tsFiles.filter((f) => f.endsWith(".landing.ts"));
const definitionFiles = tsFiles.filter((f) => !f.endsWith(".results.ts") && !f.endsWith(".landing.ts"));

if (definitionFiles.length !== 1) {
  console.error(
    `Expected exactly one definition file in ${dir}, found ${definitionFiles.length}: ${
      definitionFiles.join(", ") || "none"
    }`,
  );
  process.exit(1);
}
if (resultsFiles.length !== 1) {
  console.error(`Expected exactly one .results.ts file in ${dir}, found ${resultsFiles.length}`);
  process.exit(1);
}
if (landingFiles.length !== 1) {
  warn(`Expected one .landing.ts file, found ${landingFiles.length}. Landing copy is not validated.`);
}

// ------------------------------------------------------------------- loading

async function loadExports(file) {
  const url = pathToFileURL(join(dir, file)).href;
  try {
    return await import(url);
  } catch (err) {
    console.error(`Could not load ${file}`);
    console.error(`  ${err.message}`);
    if (/Unknown file extension|strip/i.test(err.message)) {
      console.error("  This needs Node 22.18+ or 23+ for built-in TypeScript type stripping.");
      console.error(`  Running Node ${process.version}.`);
    }
    process.exit(1);
  }
}

function pickExport(mod, predicate, label, file) {
  const found = Object.values(mod).filter((v) => v && typeof v === "object" && predicate(v));
  if (found.length === 0) {
    console.error(`No ${label} export found in ${file}`);
    process.exit(1);
  }
  if (found.length > 1) {
    warn(`${file} exports more than one ${label}. Validating the first.`);
  }
  return found[0];
}

const definitionMod = await loadExports(definitionFiles[0]);
const resultsMod = await loadExports(resultsFiles[0]);

const definition = pickExport(
  definitionMod,
  (v) => Array.isArray(v.questions) && Array.isArray(v.categories) && Array.isArray(v.tiers),
  "QuizDefinition",
  definitionFiles[0],
);

const copy = pickExport(
  resultsMod,
  (v) => v.overall && v.categories && typeof v.pageHeading === "string",
  "ResultCopySet",
  resultsFiles[0],
);

let landing = null;
if (landingFiles.length === 1) {
  const landingMod = await loadExports(landingFiles[0]);
  const candidates = Object.values(landingMod).filter(
    (v) => v && typeof v === "object" && typeof v.heroHeadline === "string",
  );
  landing = candidates[0] ?? null;
  if (!landing) warn(`${landingFiles[0]} has no export with a heroHeadline. Landing copy not validated.`);
}

// -------------------------------------------------------- definition integrity

const { slug, name, categories, questions, tiers, overallMax, sectors } = definition;

if (typeof slug !== "string" || slug.length === 0) fail("definition.slug is missing or empty");
if (typeof name !== "string" || name.length === 0) fail("definition.name is missing or empty");

// Unique ids
const categoryIds = categories.map((c) => c.id);
const dupCategoryIds = categoryIds.filter((id, i) => categoryIds.indexOf(id) !== i);
if (dupCategoryIds.length) fail(`Duplicate category ids: ${[...new Set(dupCategoryIds)].join(", ")}`);

const questionIds = questions.map((q) => q.id);
const dupQuestionIds = questionIds.filter((id, i) => questionIds.indexOf(id) !== i);
if (dupQuestionIds.length) fail(`Duplicate question ids: ${[...new Set(dupQuestionIds)].join(", ")}`);

const categoryIdSet = new Set(categoryIds);

// Category shape
for (const category of categories) {
  if (typeof category.id !== "string" || !category.id) fail("A category has no id");
  if (typeof category.label !== "string" || !category.label) fail(`Category ${category.id} has no label`);
  if (typeof category.icon !== "string" || !category.icon) warn(`Category ${category.id} has no icon name`);
  if (typeof category.maxScore !== "number") fail(`Category ${category.id} has a non-numeric maxScore`);
}

// Question shape, category membership, exactly one positive answer
const questionsPerCategory = new Map(categoryIds.map((id) => [id, 0]));
const pointsPerCategory = new Map(categoryIds.map((id) => [id, 0]));
let overallOnlyCount = 0;
let totalPositivePoints = 0;

for (const question of questions) {
  const qid = question.id ?? "(unnamed)";

  if (typeof question.text !== "string" || question.text.trim().length === 0) {
    fail(`Question ${qid} has no text`);
  }
  if (!Array.isArray(question.answers) || question.answers.length < 2) {
    fail(`Question ${qid} needs at least two answers`);
    continue;
  }

  const answerIds = question.answers.map((a) => a.id);
  const dupAnswerIds = answerIds.filter((id, i) => answerIds.indexOf(id) !== i);
  if (dupAnswerIds.length) fail(`Question ${qid} has duplicate answer ids: ${[...new Set(dupAnswerIds)].join(", ")}`);

  for (const answer of question.answers) {
    if (typeof answer.id !== "string" || !answer.id) fail(`Question ${qid} has an answer with no id`);
    if (typeof answer.label !== "string" || !answer.label) fail(`Question ${qid} answer ${answer.id} has no label`);
    if (typeof answer.points !== "number" || !Number.isFinite(answer.points)) {
      fail(`Question ${qid} answer ${answer.id} has non-numeric points`);
    }
  }

  const positives = question.answers.filter((a) => typeof a.points === "number" && a.points > 0);
  if (positives.length === 0) {
    fail(`Question ${qid} has no point-scoring answer. Every question needs exactly one.`);
  } else if (positives.length > 1) {
    fail(
      `Question ${qid} has ${positives.length} point-scoring answers (${positives
        .map((a) => a.id)
        .join(", ")}). Exactly one is required.`,
    );
  }

  const maxPoints = Math.max(...question.answers.map((a) => (typeof a.points === "number" ? a.points : 0)));
  if (maxPoints > 1) warn(`Question ${qid} scores ${maxPoints} points. This skill's convention is one point.`);
  totalPositivePoints += Math.max(0, maxPoints);

  if (question.categoryId === null || question.categoryId === undefined) {
    overallOnlyCount += 1;
    if (question.answers.length !== 2) {
      warn(`Overall-only question ${qid} has ${question.answers.length} options. The convention is two.`);
    }
  } else if (!categoryIdSet.has(question.categoryId)) {
    fail(`Question ${qid} points at unknown category "${question.categoryId}"`);
  } else {
    questionsPerCategory.set(question.categoryId, questionsPerCategory.get(question.categoryId) + 1);
    pointsPerCategory.set(question.categoryId, pointsPerCategory.get(question.categoryId) + Math.max(0, maxPoints));
  }
}

if (overallOnlyCount === 0) note("No overall-only closer. That is allowed, but the convention is one.");
if (overallOnlyCount > 1) fail(`${overallOnlyCount} overall-only questions. Exactly one is the convention.`);

// Category maxima
for (const category of categories) {
  const reachable = pointsPerCategory.get(category.id) ?? 0;
  const count = questionsPerCategory.get(category.id) ?? 0;
  if (count === 0) {
    fail(`Category ${category.id} has no questions`);
  } else if (category.maxScore !== reachable) {
    fail(
      `Category ${category.id} maxScore is ${category.maxScore} but its questions can score ${reachable} (${count} question${
        count === 1 ? "" : "s"
      })`,
    );
  }
  if (count === 1) {
    warn(`Category ${category.id} has one question, so it can only score 0% or 100%.`);
  }
}

// Overall max
if (typeof overallMax !== "number") {
  fail("definition.overallMax is not a number");
} else if (overallMax !== totalPositivePoints) {
  fail(`overallMax is ${overallMax} but the questions can score ${totalPositivePoints} in total`);
}

// Question count
if (questions.length < 5) warn(`${questions.length} questions. Short instruments produce coarse scores.`);
if (questions.length > 15) warn(`${questions.length} questions. Completion falls as length rises.`);

// Sectors, when present
if (sectors !== undefined) {
  if (!Array.isArray(sectors) || sectors.length === 0) {
    fail("definition.sectors is present but empty");
  } else {
    const sectorIds = sectors.map((s) => s.id);
    const dupSectors = sectorIds.filter((id, i) => sectorIds.indexOf(id) !== i);
    if (dupSectors.length) fail(`Duplicate sector ids: ${[...new Set(dupSectors)].join(", ")}`);
    for (const sector of sectors) {
      if (!sector.id || !sector.label) fail("A sector is missing an id or a label");
    }
  }
}

// ------------------------------------------------------------- tier coverage

const TIER_IDS = ["low", "medium", "high"];

if (!Array.isArray(tiers) || tiers.length !== 3) {
  fail(`Expected three tiers, found ${Array.isArray(tiers) ? tiers.length : "none"}`);
} else {
  for (const id of TIER_IDS) {
    if (!tiers.some((t) => t.id === id)) fail(`No tier with id "${id}"`);
  }
  for (const tier of tiers) {
    if (!TIER_IDS.includes(tier.id)) fail(`Unknown tier id "${tier.id}". Allowed: ${TIER_IDS.join(", ")}`);
    if (typeof tier.label !== "string" || !tier.label) fail(`Tier ${tier.id} has no label`);
    if (typeof tier.min !== "number" || typeof tier.max !== "number") {
      fail(`Tier ${tier.id} has non-numeric bounds`);
    } else if (tier.min > tier.max) {
      fail(`Tier ${tier.id} has min ${tier.min} above max ${tier.max}`);
    }
    if (/^(low|medium|high)$/i.test(String(tier.label))) {
      warn(`Tier ${tier.id} is labelled "${tier.label}". Name the tiers for the client.`);
    }
  }

  // Every integer percent 0..100 falls in exactly one tier
  const uncovered = [];
  const overlapped = [];
  for (let percent = 0; percent <= 100; percent += 1) {
    const hits = tiers.filter((t) => percent >= t.min && percent <= t.max);
    if (hits.length === 0) uncovered.push(percent);
    if (hits.length > 1) overlapped.push(percent);
  }
  const summarise = (list) => {
    if (list.length <= 6) return list.join(", ");
    return `${list.slice(0, 6).join(", ")} and ${list.length - 6} more`;
  };
  if (uncovered.length) fail(`Percentages covered by no tier: ${summarise(uncovered)}`);
  if (overlapped.length) fail(`Percentages covered by more than one tier: ${summarise(overlapped)}`);
}

// ------------------------------------------------------- tier reachability

function tierFor(percent) {
  const hit = tiers.find?.((t) => percent >= t.min && percent <= t.max);
  return hit ? hit.id : null;
}

if (Array.isArray(tiers) && tiers.length === 3 && typeof overallMax === "number" && overallMax > 0) {
  const reachedOverall = new Set();
  for (let raw = 0; raw <= overallMax; raw += 1) {
    const tier = tierFor(Math.round((raw / overallMax) * 100));
    if (tier) reachedOverall.add(tier);
  }
  for (const id of TIER_IDS) {
    if (!reachedOverall.has(id)) {
      fail(`Overall tier "${id}" is unreachable. No achievable score falls inside its band.`);
    }
  }

  for (const category of categories) {
    if (typeof category.maxScore !== "number" || category.maxScore <= 0) continue;
    const reached = new Set();
    for (let raw = 0; raw <= category.maxScore; raw += 1) {
      const tier = tierFor(Math.round((raw / category.maxScore) * 100));
      if (tier) reached.add(tier);
    }
    const missing = TIER_IDS.filter((id) => !reached.has(id));
    if (missing.length) {
      warn(
        `Category ${category.id} can never score ${missing.join(" or ")}. Its copy for ${missing.join(
          " and ",
        )} will never render.`,
      );
    }
  }
}

// ---------------------------------------------------------- copy coverage

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

if (!isNonEmptyString(copy.pageHeading)) fail("Result copy has no pageHeading");

for (const id of TIER_IDS) {
  const variant = copy.overall?.[id];
  if (!variant) {
    fail(`Result copy has no overall variant for tier "${id}"`);
    continue;
  }
  if (!isNonEmptyString(variant.lede)) fail(`Overall "${id}" has no lede`);
  if (!Array.isArray(variant.paragraphs) || variant.paragraphs.length === 0) {
    fail(`Overall "${id}" has no paragraphs`);
  } else {
    variant.paragraphs.forEach((p, i) => {
      if (!isNonEmptyString(p)) fail(`Overall "${id}" paragraph ${i + 1} is empty`);
    });
    if (variant.paragraphs.length < 3) {
      warn(`Overall "${id}" has ${variant.paragraphs.length} paragraphs. The spec asks for three.`);
    }
  }
}

const copyCategoryKeys = Object.keys(copy.categories ?? {});
for (const category of categories) {
  const entry = copy.categories?.[category.id];
  if (!entry) {
    fail(`Result copy has no entry for category "${category.id}"`);
    continue;
  }
  if (entry.label !== category.label) {
    fail(`Category "${category.id}" label mismatch: definition "${category.label}", copy "${entry.label}"`);
  }
  for (const id of TIER_IDS) {
    const variant = entry[id];
    if (!variant) {
      fail(`Category "${category.id}" has no "${id}" variant`);
      continue;
    }
    if (!isNonEmptyString(variant.body)) fail(`Category "${category.id}" tier "${id}" has an empty body`);
    if (!isNonEmptyString(variant.topTip)) fail(`Category "${category.id}" tier "${id}" has no topTip`);
    if (typeof variant.topTip === "string" && /^\s*top tip\s*:/i.test(variant.topTip)) {
      warn(`Category "${category.id}" tier "${id}" topTip repeats the "Top Tip:" label. The UI renders it.`);
    }
  }
}
for (const key of copyCategoryKeys) {
  if (!categoryIdSet.has(key)) fail(`Result copy has category "${key}" which the definition does not define`);
}

// CTA
const cta = copy.cta;
if (!cta) {
  fail("Result copy has no cta block");
} else {
  for (const field of ["heading", "body", "buttonLabel", "buttonHref"]) {
    if (!isNonEmptyString(cta[field])) fail(`cta.${field} is missing or empty`);
  }
}

// Landing copy
if (landing) {
  if (!isNonEmptyString(landing.heroHeadline)) fail("Landing copy has no heroHeadline");
  if (!isNonEmptyString(landing.heroCtaLabel)) fail("Landing copy has no heroCtaLabel");
  if (!isNonEmptyString(landing.heroCtaHref)) fail("Landing copy has no heroCtaHref");
  if (!Array.isArray(landing.inTwoMinutes) || landing.inTwoMinutes.length < 3) {
    warn("Landing copy should carry three 'in two minutes you will know' bullets");
  }
  if (!Array.isArray(landing.youllReceive) || landing.youllReceive.length === 0) {
    warn("Landing copy has no 'you will receive' items");
  }
}

// ------------------------------------------------------------- style checks

const styleTargets = [];
const collectStrings = (value, path) => {
  if (typeof value === "string") styleTargets.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => collectStrings(v, `${path}[${i}]`));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) collectStrings(v, `${path}.${k}`);
  }
};
collectStrings(copy, "results");
if (landing) collectStrings(landing, "landing");
collectStrings(questions, "questions");

const emDashHits = styleTargets.filter(([, text]) => text.includes("—"));
if (emDashHits.length) {
  warn(`${emDashHits.length} string${emDashHits.length === 1 ? "" : "s"} contain an em dash. First: ${emDashHits[0][0]}`);
}

const TIME_ESTIMATE = /\b\d+\s*(?:-\s*\d+\s*)?(?:min(?:ute)?s?|hours?|hrs?|days?|weeks?)\b/i;
const timeHits = styleTargets.filter(([path, text]) => TIME_ESTIMATE.test(text) && !/^questions/.test(path));
if (timeHits.length) {
  note(
    `${timeHits.length} copy string${timeHits.length === 1 ? "" : "s"} mention a duration. Stating how long the quiz takes is fine. Effort estimates are not. First: ${timeHits[0][0]}`,
  );
}

// ---------------------------------------------------------------- summary

const line = "-".repeat(66);
console.log(line);
console.log(`Scorecard instrument validation: ${slug ?? basename(dir)}`);
console.log(line);
console.log(`  Pack directory   ${dir}`);
console.log(`  Definition       ${definitionFiles[0]}`);
console.log(`  Result copy      ${resultsFiles[0]}`);
console.log(`  Landing copy     ${landingFiles[0] ?? "not found"}`);
console.log(`  Questions        ${questions.length} (${overallOnlyCount} overall-only)`);
console.log(`  Categories       ${categories.length} (${categories.map((c) => `${c.id}:${c.maxScore}`).join(", ")})`);
console.log(`  Overall max      ${overallMax}`);
if (Array.isArray(tiers)) {
  console.log(`  Tiers            ${tiers.map((t) => `${t.label} ${t.min}-${t.max}`).join(", ")}`);
}
if (Array.isArray(sectors)) console.log(`  Sectors          ${sectors.length}`);
console.log(`  Copy blocks      ${3 + categories.length * 3} expected (3 overall, ${categories.length} x 3 category)`);
console.log(line);

for (const message of notes) console.log(`  note     ${message}`);
for (const message of warnings) console.log(`  WARNING  ${message}`);
for (const message of errors) console.log(`  FAIL     ${message}`);

if (notes.length || warnings.length || errors.length) console.log(line);

if (errors.length) {
  console.log(`FAILED: ${errors.length} error${errors.length === 1 ? "" : "s"}, ${warnings.length} warning${warnings.length === 1 ? "" : "s"}.`);
  console.log("Fix every error before handing the pack over.");
  process.exit(1);
}

console.log(`PASSED: 0 errors, ${warnings.length} warning${warnings.length === 1 ? "" : "s"}.`);
if (warnings.length) console.log("Warnings are judgement calls. Read them before shipping.");
process.exit(0);
