# City Page Data Template

Use this template when generating new city page entries for `site/src/lib/city-data.ts`.

## Data Shape

```typescript
'{slug}': {
  name: '{City Name}',
  slug: '{slug}',
  county: '{County Name}',  // e.g. 'King County', 'Pierce County'
  lat: '{latitude}',        // to 4 decimal places
  lng: '{longitude}',       // to 4 decimal places
  intro: '{2-3 sentences}',
  localDetails: '{2-3 sentences}',
  faqs: [
    { question: '{Q1}', answer: '{A1}' },
    { question: '{Q2}', answer: '{A2}' },
    { question: '{Q3}', answer: '{A3}' },
  ],
  nearbyCity1: { name: '{Name}', slug: '{slug}' },
  nearbyCity2: { name: '{Name}', slug: '{slug}' },
},
```

## Content Guidelines

### intro (2-3 sentences)
- Mention Got Moles has served since 2017
- Reference chemical-free methods safe for pets and children
- Include something specific to the city (population, property values, character)
- Do NOT use generic filler — every intro must be unique

### localDetails (2-3 sentences)
- Name 2-3 real neighborhoods, parks, or geographic features
- Reference soil conditions specific to the area (alluvial, glacial till, clay, volcanic loam)
- Explain why moles thrive there (proximity to rivers, forests, farmland, irrigation)
- Mention Townsend's moles specifically (the species in Western WA)

### FAQs (exactly 3)
Standard questions that every city page uses:
1. "Do you service all of {City}?" — list specific neighborhoods
2. "How bad is the mole problem in {City}?" — reference local conditions
3. "How quickly can you get to {City}?" — "within two business days" for core areas, "two to three" for outlying areas

### nearbyCity1, nearbyCity2
- Must reference cities that exist in city-data.ts
- Choose geographically adjacent cities
- Slug must match exactly (kebab-case)

## Slug Rules
- Kebab-case: `lake-forest-park`, `des-moines`, `bainbridge-island`
- Match the URL pattern: `/mole-control-{slug}`
- Single-word cities are just lowercase: `shoreline`, `burien`, `bothell`

## County Select Values
When seeding to CMS, use lowercase keys: `king`, `pierce`, `snohomish`, `thurston`, `kitsap`
In city-data.ts display format: `'King County'`, `'Pierce County'`, etc.
