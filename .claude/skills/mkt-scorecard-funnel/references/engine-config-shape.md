# Engine config shape

The exact TypeScript the scorecard engine reads. A quiz is three content files and no code. Emit
them verbatim to these shapes or the engine rejects them at load.

Two engines are in use and they share this core. The differences are marked **fork only**.

---

## 1. The core types

These live in the engine, not in the pack you emit. They are reproduced here so the config you
write matches them exactly. The engine file has zero imports and must stay importable under plain
node with no framework present.

```ts
export interface AnswerOption {
  id: string;
  label: string;
  points: number;
}

export interface Question {
  id: string;
  text: string;
  /** null means the question is overall-only and contributes to no category. */
  categoryId: string | null;
  answers: AnswerOption[];
}

export interface Category {
  id: string;
  label: string;
  icon: string;      // a lucide-react component name, e.g. "Clock"
  maxScore: number;  // must equal the number of questions in this category
}

export interface Tier {
  id: "low" | "medium" | "high";
  label: string;     // the client-facing tier name, e.g. "Exposed"
  min: number;       // inclusive percent
  max: number;       // inclusive percent
}

export interface Sector {          // fork only
  id: string;
  label: string;
}

export interface QuizDefinition {
  slug: string;
  name: string;
  categories: Category[];
  questions: Question[];
  tiers: Tier[];
  overallMax: number;              // must equal the total question count
  sectors?: Sector[];              // fork only, required in the stateless fork
}
```

Note the constraint the type system cannot express. `Tier["id"]` is fixed at three values. The
tier's `label` carries the client's naming. Do not attempt a fourth band without changing the
engine first.

## 2. Result copy shapes

```ts
export interface OverallCopyVariant {
  lede: string;
  paragraphs: string[];
}

export interface CategoryCopyVariant {
  body: string;
  topTip: string;   // no "Top Tip:" prefix, the UI renders the label
}

export interface CategoryCopyEntry {
  label: string;    // must equal the Category label in the definition
  low: CategoryCopyVariant;
  medium: CategoryCopyVariant;
  high: CategoryCopyVariant;
}

export interface CtaCopy {
  heading: string;
  body: string;
  buttonLabel: string;
  buttonHref: string;
}

export interface ResultCopySet {
  pageHeading: string;
  overall: Record<"low" | "medium" | "high", OverallCopyVariant>;
  categories: Record<string, CategoryCopyEntry>;  // keyed by category id
  cta: CtaCopy;
}
```

A missing tier variant throws `MissingResultCopyError` at render, by design. A copy gap fails loudly
rather than rendering a blank block to a visitor.

## 3. Landing copy shape

The landing shape is per-instance and you define it in the `.landing.ts` file itself. Keep it a
plain object with no React import and no component import. This is the working shape:

```ts
export type LandingIconName = string;   // a lucide-react component name

export interface LandingReceiveItem {
  title: string;
  description: string;
  icon: LandingIconName;
}

export interface LandingCopy {
  heroHeadline: string;
  heroSub: string;
  heroCtaLabel: string;
  heroCtaHref: string;
  inTwoMinutesHeading: string;
  inTwoMinutes: string[];        // three bullets
  youllReceiveHeading: string;
  youllReceive: LandingReceiveItem[];
}
```

## 4. What you emit

Three files, named for the slug, in `projects/mkt-scorecard-funnel/{client-slug}/`.

| File | Exports | Notes |
|------|---------|-------|
| `{slug}.ts` | `export const {camelSlug}: QuizDefinition` | The instrument |
| `{slug}.landing.ts` | `export const {camelSlug}LandingCopy: LandingCopy` | Landing page strings |
| `{slug}.results.ts` | `export const {camelSlug}ResultCopy: ResultCopySet` | Every result variant |

Each file opens with a type-only import pointing at where the engine lives in the target repo:

```ts
import type { QuizDefinition } from "../../lib/scorecard-engine/types";
```

That import is erased before the file runs, so the path never has to resolve for the validator. It
does have to be correct once the file lands in the target repo. Adjust the depth when you drop the
files in.

Every file is copy and data only. No React import, no component import, no helper function, no
computed value. A config file that has to run logic is not a config file.

## 5. Worked skeleton

```ts
import type { QuizDefinition } from "../../lib/scorecard-engine/types";

export const handoverReadinessScore: QuizDefinition = {
  slug: "handover-readiness-score",
  name: "Handover Readiness Score",
  overallMax: 10,
  categories: [
    { id: "documented", label: "WRITTEN DOWN", icon: "FileText", maxScore: 3 },
    { id: "coverage", label: "WHO ELSE CAN DO IT", icon: "Users", maxScore: 3 },
    { id: "tooling", label: "WHAT RUNS ITSELF", icon: "Settings", maxScore: 2 },
    { id: "evidence", label: "PROOF IT WORKS", icon: "ClipboardCheck", maxScore: 1 },
  ],
  tiers: [
    { id: "low", label: "Owner-dependent", min: 0, max: 39 },
    { id: "medium", label: "Partly covered", min: 40, max: 79 },
    { id: "high", label: "Runs without you", min: 80, max: 100 },
  ],
  sectors: [
    { id: "professional-services", label: "Professional services" },
    { id: "other", label: "Something else" },
  ],
  questions: [
    {
      id: "q1",
      categoryId: "documented",
      text: "In the last 12 months, has anyone written down how your busiest recurring job actually gets done?",
      answers: [
        { id: "written", label: "Yes, it is written down", points: 1 },
        { id: "partly", label: "Some of it is", points: 0 },
        { id: "no", label: "No, or I'm not sure", points: 0 },
      ],
    },
    // ... q2 to q9, each with categoryId set
    {
      id: "q10",
      categoryId: null,     // overall-only intent closer
      text: "If we showed you the three changes that would move your score most, would you act on them this quarter?",
      answers: [
        { id: "yes", label: "Yes", points: 1 },
        { id: "no", label: "No", points: 0 },
      ],
    },
  ],
};
```

Category maxima add to nine. The overall-only closer adds the tenth point. `overallMax` is ten.
That arithmetic is the single most common config error and the validator checks it first.

## 6. Reverse-scored questions

A question can be phrased so the freedom-positive or health-positive answer is "No". That is fine
and sometimes the honest phrasing. Put the point on the correct answer and leave a comment saying
so, because a reader scanning the file will otherwise read it as a bug:

```ts
{
  id: "q8",
  categoryId: "time-traps",
  text: "Do your employed friends seem to have better work-life balance than you?",
  answers: [
    // Reverse-scored: No is the positive answer here.
    { id: "yes", label: "Yes", points: 0 },
    { id: "no", label: "No", points: 1 },
    { id: "some", label: "Some of them", points: 0 },
  ],
},
```

Use this sparingly. One reverse-scored question in an instrument is a change of pace. Three is a
comprehension problem for the person answering.

## 7. Scoring behaviour you are configuring against

Read this before choosing points and bands, because it decides what a config change does.

- Category percent is the category's raw points over its `maxScore`, rounded with `Math.round`.
- Overall percent is total raw points over `overallMax`, rounded the same way.
- Raw scores clamp at zero before the percentage, so a negative total can never produce a negative
  percentage.
- The tier is resolved from the percent, per category and overall, against the same band table.
- An unknown question id, an unknown answer id, or a missing answer throws. A malformed submission
  never produces a plausible-looking score.

The consequence for band design: with ten single-point questions the achievable overall percentages
are the multiples of ten. A band edge at 39 and 40 behaves identically to one at 35 and 36. Set the
edges where the copy changes meaning, then check which whole scores fall in each band and make sure
none of the three bands is unreachable.

## 8. Extending the shape

The stateless fork added `sectors` and nothing else. That is the model for extension: add the
smallest field that carries the new content, keep it optional in the shared type, and let a real
second client force the change rather than designing for imagined ones. Anything still hardcoded in
a component when a second quiz ships is a bug in the engine, not a gap in the config.
