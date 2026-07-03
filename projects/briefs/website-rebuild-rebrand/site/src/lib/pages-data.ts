/**
 * pages-data.ts
 *
 * Payload CMS block arrays for the 5 static pages:
 *   - How It Works  (/how-it-works/)
 *   - About         (/about/)
 *   - FAQ           (/faq/)
 *   - Contact       (/contact/)
 *   - Reviews       (/reviews/)
 *
 * Each export maps directly to a Pages collection `blocks` field.
 * Block slugs and field names match src/blocks/*.ts exactly.
 *
 * richText fields use minimal Lexical JSON (paragraph nodes only).
 * Use sectionsToLexical() from seed.ts for heading+paragraph combos.
 * Simple single-paragraph richText is inlined as a root→paragraph→text tree.
 */

// ---------------------------------------------------------------------------
// Helper — minimal Lexical JSON builders
// ---------------------------------------------------------------------------

function textNode(text: string, format = 0) {
  return {
    type: 'text',
    text,
    version: 1,
    format,
    detail: 0,
    mode: 'normal',
    style: '',
  }
}

// Parse a string into Lexical children, honouring **bold** and [anchor](url) markers.
function parseInline(text: string): object[] {
  const children: object[] = []
  // Combined: [anchor](url) OR **bold**. Group 1+2 = link, group 3 = bold.
  const RE = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = RE.exec(text)) !== null) {
    if (m.index > last) children.push(textNode(text.slice(last, m.index)))
    if (m[1] && m[2]) {
      children.push({
        type: 'link',
        version: 2,
        fields: { url: m[2], linkType: 'custom', newTab: false },
        children: [textNode(m[1])],
        direction: 'ltr',
        format: '',
        indent: 0,
      })
    } else if (m[3]) {
      children.push(textNode(m[3], 1))
    }
    last = m.index + m[0].length
  }
  if (last < text.length) children.push(textNode(text.slice(last)))
  if (children.length === 0) children.push(textNode(text))
  return children
}

function makeParagraph(text: string) {
  return {
    type: 'paragraph' as const,
    version: 1,
    children: parseInline(text),
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
    textStyle: '',
  }
}

function makeHeading(text: string, tag: 'h2' | 'h3' = 'h2') {
  return {
    type: 'heading' as const,
    tag,
    version: 1,
    children: [
      {
        type: 'text',
        text,
        version: 1,
        format: 0,
        detail: 0,
        mode: 'normal',
        style: '',
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
  }
}

function makeListItem(text: string, value: number) {
  return {
    type: 'listitem' as const,
    version: 1,
    value,
    children: parseInline(text),
    direction: 'ltr',
    format: '',
    indent: 0,
  }
}

function makeList(items: string[], variant: 'bullet' | 'number' = 'bullet') {
  return {
    type: 'list' as const,
    listType: variant,
    tag: variant === 'bullet' ? ('ul' as const) : ('ol' as const),
    version: 1,
    start: 1,
    children: items.map((t, i) => makeListItem(t, i + 1)),
    direction: 'ltr',
    format: '',
    indent: 0,
  }
}

function makeLexical(...nodes: object[]) {
  return {
    root: {
      type: 'root',
      version: 1,
      children: nodes,
      direction: 'ltr',
      format: '',
      indent: 0,
    },
  }
}

function paragraphs(...texts: string[]) {
  return makeLexical(...texts.map(makeParagraph))
}

// ---------------------------------------------------------------------------
// HOW IT WORKS
// ---------------------------------------------------------------------------

export const howItWorksBlocks = [
  // ── Hero ──────────────────────────────────────────────────────────────────
  {
    blockType: 'hero',
    heading: 'From First Call to Mole-Free Yard',
    subheading:
      'No guesswork. No wasted time. Here\'s exactly what happens when you call Got Moles.',
    layout: 'left',
    heroHeight: '85vh',
    fallbackImage: 'hero-overhead-digging',
    cta: {
      text: 'CALL (253) 750-0211',
      url: 'tel:+12537500211',
      style: 'primary',
    },
    trustStrip: ['5-Star Rated', 'Nearly 5,000 Clients Served', 'Since 2017', 'Veteran-Owned', 'Safe for Pets & Kids'],
  },

  // ── GEO Definition ────────────────────────────────────────────────────────
  {
    blockType: 'geoDefinition',
    content:
      'Got Moles uses a 4-step residential mole control process: phone consultation and quote, booking with a $150 setup fee, a first service visit where the technician inspects the property and sets professional equipment, and weekly checks for 4-5 weeks with a written report after every visit. Inspection and trap-setting happen on the same booked visit — there is no separate pre-booking inspection. All methods are chemical-free. Most residential mole problems are resolved within one month.',
  },

  // ── Steps Process ─────────────────────────────────────────────────────────
  {
    blockType: 'stepsProcess',
    heading: 'The 4-Step Got Moles Process',
    showDivider: false,
    steps: [
      {
        number: '01',
        title: 'You Call. We Quote.',
        summary: "Call or fill out the form — we'll quote your property over the phone.",
        description:
          "Phone us at (253) 750-0211 or fill out the form on our contact page. We'll ask a few questions — where you're seeing damage, how long it's been going on, whether you've tried anything already — and give you a clear price right then. No pressure, no upsell, no surprise quote visit. We quote and book over the phone.",
      },
      {
        number: '02',
        title: 'You Book. You Pay $150 to Start.',
        summary: 'Confirm your service and pay the $150 setup. That is all you owe upfront.',
        description:
          "Once you're ready, we schedule your first visit and take the $150 setup fee. That's the only thing you pay upfront. The $300 balance is only due if we catch moles — $450 total max for residential under 1 acre. If we don't catch any, the $150 setup is all you owe.",
      },
      {
        number: '03',
        title: 'First Visit: We Inspect and Set Traps.',
        summary: 'Tech walks your yard on arrival, identifies active runs, and sets professional equipment — all in one visit.',
        description:
          "On your booked date, our technician arrives and does the full property walk on arrival — active mole runs, fresh mounds, soil displacement, entry patterns. This isn't a drive-by; it's a hands-on assessment of what's happening underground. From that assessment, professional-grade equipment goes on the most active tunnels — all in the same visit. There is no separate pre-booking inspection. The first paid visit covers both the assessment and the trap-setting.",
      },
      {
        number: '04',
        title: 'Weekly Checks. Written Report. Balance Only If We Catch.',
        summary: 'We return weekly for 4-5 weeks. Written report after every visit. $300 balance only if moles caught.',
        description:
          "We come back weekly to check traps, adjust placement, and respond to changes in mole activity. You don't need to be home and you don't need to touch anything — just flatten any new mounds between visits so we can track fresh activity. After every visit, you get a written report: what we checked, what we found, what we did. If we catch moles, the $300 balance is due at the end. If we don't catch any, you owe nothing beyond the $150 setup.",
      },
    ],
    background: 'grass-alt',
  },

  // ── Choose Your Service (Service Cross-Links) ────────────────────────────
  {
    blockType: 'featureGrid',
    heading: 'Choose Your Got Moles Service',
    showDivider: false,
    columns: '3',
    background: 'grass',
    items: [
      {
        title: 'Total Mole Control Program',
        description:
          'Year-round protection for $100/month. Regular monitoring, immediate response to new activity, written report after every visit. About 500 homeowners enrolled.',
        price: '$100/month',
        link: '/services/total-mole-control-program/',
        linkText: 'See Year-Round Mole Protection',
      },
      {
        title: 'One-Time Mole Removal',
        description:
          "$450 flat rate. 4-5 weekly visits. Inspection, professional trapping, and full equipment removal. Guaranteed — if we don't catch a mole, you only pay the $150 setup fee.",
        price: '$450 flat rate',
        link: '/services/one-time-mole-removal/',
        linkText: 'See One-Time Mole Removal',
      },
      {
        title: 'Commercial Mole Control',
        description:
          'Annual contracts for property managers, HOAs, sports facilities, schools, and landscaping contractors. Custom-quoted after site inspection.',
        price: 'Custom quote',
        link: '/services/commercial-mole-control/',
        linkText: 'See Commercial Mole Control',
      },
    ],
  },

  // ── What Happens After ─────────────────────────────────────────────────────
  {
    blockType: 'richContent',
    heading: 'What Happens When the Moles Are Gone?',
    showDivider: false,
    background: 'grass-alt',
    content: paragraphs(
      'Your yard is clear. The damage stops. You can actually enjoy the lawn you\'ve been paying to maintain.',
      'Here\'s what most people don\'t realize: moles will try again. A cleared yard is still attractive territory. New moles move in from neighboring properties, especially during peak season.',
      'That\'s why most of our clients choose ongoing protection through the Total Mole Control Program — $100/month for year-round monitoring, immediate response, and a report after every visit.',
    ),
  },

  // ── Process FAQ ───────────────────────────────────────────────────────────
  {
    blockType: 'faq',
    heading: 'Questions About the Process',
    showDivider: false,
    background: 'grass',
    generateSchema: true,
    items: [
      {
        question: 'How long does the one-time program take?',
        answer:
          'About one month, with 4-5 weekly visits. Most properties see a big drop in mole activity within the first two weeks.',
      },
      {
        question: 'Do I need to be home during visits?',
        answer:
          "No. We can access your property and complete the visit without you there. We'll leave a report each time so you know what happened.",
      },
      {
        question: 'Is your method safe for my kids and pets?',
        answer:
          'Yes. We use chemical-free trapping methods only. No poisons, no chemicals, no toxicants on your property. Our methods pose no risk to your family or animals.',
      },
      {
        question: 'How quickly can you come out?',
        answer:
          "We quote and book over the phone — there is no separate pre-booking inspection. Once you book, we can usually have a technician at your property within a few business days. Your first visit covers both the property walk-through and the trap-setting.",
      },
    ],
    moreLink: {
      text: 'More mole control questions answered',
      url: '/faq/',
    },
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  {
    blockType: 'cta',
    heading: "Let's Get Started.",
    body: "Call (253) 750-0211 or fill out the form below. We'll quote your property over the phone and book your first visit within days.",
    buttonText: 'CALL (253) 750-0211',
    buttonUrl: 'tel:+12537500211',
    buttonStyle: 'primary',
    subtext: 'Free quote. No obligation.',
    showForm: true,
    background: 'gradient',
  },
]

export const howItWorksMeta = {
  title: 'How Mole Control Works | 4-Step Process',
  description:
    "From first call to mole-free yard: how Got Moles' 4-step residential process works. Phone quote, booking, first-visit assessment and trap-setting, then weekly checks with a written report.",
}

// ---------------------------------------------------------------------------
// ABOUT
// ---------------------------------------------------------------------------

export const aboutBlocks = [
  // ── Hero ──────────────────────────────────────────────────────────────────
  {
    blockType: 'hero',
    heading: "About Got Moles — Western Washington's Mole Specialists",
    subheading: 'One man. One focus. Nearly 5,000 yards saved.',
    layout: 'centered',
    heroHeight: '85vh',
    fallbackImage: 'hero-team-line',
    cta: {
      text: 'GET A FREE QUOTE',
      url: '/contact',
      style: 'primary',
    },
    trustStrip: ['5-Star Rated', 'Nearly 5,000 Clients Served', 'Since 2017', 'Veteran-Owned', 'Safe for Pets & Kids'],
  },

  // ── GEO Definition ────────────────────────────────────────────────────────
  {
    blockType: 'geoDefinition',
    content:
      'Got Moles was founded in 2017 by Spencer Hill, a US Army veteran based in Enumclaw, Washington. The company specializes exclusively in mole control and has served nearly 5,000 clients across 92+ communities in 6 Western Washington counties: King, Pierce, Snohomish, Thurston, Kitsap, and Lewis. Last updated May 2026.',
  },

  // ── Origin Story ──────────────────────────────────────────────────────────
  {
    blockType: 'richContent',
    heading: "Spencer's Father's Garden",
    showDivider: false,
    background: 'grass-alt',
    content: paragraphs(
      'For Spencer Hill, it started with his father.',
      "His dad took real pride in his garden. It wasn't just a lawn — it was something he'd built and maintained over years. Then the moles came. And they didn't just damage the garden. They wrecked the peace of the whole household.",
      'He watched his father spend weekend after weekend fighting it. They tried everything — store-bought traps, home remedies, products that promised results. Every time they thought they\'d cracked it, the moles came back.',
      "That stuck with him. Years later, when he started [trapping moles himself](/services/one-time-mole-removal/) — first in his own yard in Buckley, then for neighbors, then for the wider community — he understood something most pest control companies miss. This isn't just a lawn problem. It's a stress problem.",
    ),
  },

  // ── Building the Company ──────────────────────────────────────────────────
  {
    blockType: 'richContent',
    heading: 'From Buckley to 92+ Communities Across 6 Counties',
    showDivider: false,
    background: 'grass',
    content: paragraphs(
      'In 2017, he made it official and founded Got Moles. The business grew through word of mouth first — because he solved the problem properly, and people told their neighbors.',
      'Today, Got Moles has served nearly 5,000 clients across Western Washington, covering [92+ communities across 6 counties](/service-areas/): King, Pierce, Snohomish, Thurston, Kitsap, and Lewis.',
    ),
  },

  // ── Why Moles Only ────────────────────────────────────────────────────────
  {
    blockType: 'richContent',
    heading: 'Why We Only Do Moles',
    showDivider: false,
    background: 'grass-alt',
    content: paragraphs(
      'Most pest companies offer everything. Ants. Spiders. Termites. Rodents. And somewhere on the list, moles.',
      "He made a different choice. He'd seen what generalists delivered for mole problems — a technician who'd done a spider job that morning, using whatever was on the truck, following a generic protocol. Inconsistent results. Constant callbacks.",
      "Got Moles exists because mole control deserves the same focus any serious trade gives its craft. We went deep instead of wide. That focus is why [our results are different](/how-it-works/).",
      "**Spencer Hill, founder of Got Moles** — over 8 years and nearly 5,000 Western Washington properties of field experience — observes: \"You can't beat a Western Washington mole problem with a generalist truck and a generic protocol. The animals don't behave the way the protocol assumes. The species mix is regional. The tunnel patterns track the soil and the seasons. Eight years of doing nothing else is what produces a [first-visit catch instead of three visits and a callback](/how-it-works/).\"",
    ),
  },

  // ── Built on Discipline ───────────────────────────────────────────────────
  {
    blockType: 'richContent',
    heading: 'US Army Veteran-Founded: Built on Military Discipline',
    showDivider: false,
    background: 'grass',
    content: paragraphs(
      "Spencer served in the US Army as an infantryman from 2011 to 2014. He doesn't bring it up for marketing points — the discipline and the refusal to cut corners carried straight into how Got Moles operates.",
      "Show up when you say you will. Do the job properly. Report the results honestly. He didn't learn those from a business book. He lived them before Got Moles existed.",
      "Four disciplines from the Army show up on every Got Moles visit. **Response-time discipline.** Calls returned within one business day, inspections scheduled within two. **Evidence-led trapping.** Equipment goes on active tunnels we have verified, not where the textbook says it should. **Written reports after every visit.** What we found, what we did, what is next. **No corner-cutting.** If a property needs another visit, we book it. If a trap-line needs adjustment, we adjust. The customer never carries the cost of our shortcuts because there are none.",
    ),
  },

  // ── Featured Testimonial ──────────────────────────────────────────────────
  // Three quotes covering the three GBP catchments — King/Eastside (Seattle),
  // Pierce (Tacoma), and a 22-year sufferer who became one of the first TMCP
  // annual subscribers. Picked for entity-graph city diversity and E-E-A-T.
  {
    blockType: 'testimonial',
    heading: 'What Western Washington Homeowners Say About Got Moles',
    showDivider: false,
    background: 'grass-alt',
    quotes: [
      {
        text: "We tried everything non-lethal to get rid of our moles. Sonic mole repellent, castor oil, coyote urine — nothing worked. Got Moles came out and set effective traps.",
        name: 'Sabra Bösewicht',
        city: 'Seattle, WA',
        rating: 5,
      },
      {
        text: "We live on a 5-acre property, and since 2022 these guys have removed 27 moles from our property. When we first moved in the moles were everywhere.",
        name: 'Brian Wozeniak',
        city: 'Tacoma, WA',
        rating: 5,
      },
      {
        text: "I believe we were the first of Got Moles annual customers. We have fought moles for the entire 22 years we've lived here.",
        name: 'Christina McDougall',
        city: 'Seattle, WA',
        rating: 5,
      },
    ],
    moreLink: {
      text: 'See All 219+ Reviews',
      url: '/reviews/',
    },
  },

  // ── By The Numbers ────────────────────────────────────────────────────────
  {
    blockType: 'stats',
    heading: 'Got Moles by the Numbers',
    background: 'grass',
    items: [
      {
        number: '5,000+',
        label: 'Properties Treated',
        description: 'Across Western Washington since founding in 2017. Chemical-free trapping on every job.',
      },
      {
        number: '219+',
        label: 'Five-Star Google Reviews',
        description: 'Across our three Western Washington Google Business Profiles.',
      },
      {
        number: '92+',
        label: 'Communities Served',
        description: 'From Seattle south to Olympia, east to Enumclaw, across 6 counties: King, Pierce, Snohomish, Thurston, Kitsap, and Lewis.',
      },
      {
        number: '100%',
        label: 'Mole Focus',
        description: 'No ants. No spiders. No rodents. Moles are all we do — and why we get them.',
      },
    ],
  },

  // ── Where We Work (Tier-A city cluster) ───────────────────────────────────
  // Per str-internal-links + target-keywords.md anchor diversity (Rule 5).
  // Mix of "mole control [city]", "[city] yard mole removal", and bare city
  // anchors to avoid over-optimisation. Twelve cities cover ~80% of LTV.
  {
    blockType: 'serviceArea',
    heading: 'Where We Work in Western Washington',
    showDivider: false,
    background: 'grass-alt',
    cities: [
      { name: 'Mole Control Seattle', url: '/mole-control-seattle/' },
      { name: 'Mole Control Tacoma', url: '/mole-control-tacoma/' },
      { name: 'Bellevue Yard Mole Removal', url: '/mole-control-bellevue/' },
      { name: 'Mole Control Sammamish', url: '/mole-control-sammamish/' },
      { name: 'Puyallup', url: '/mole-control-puyallup/' },
      { name: 'Renton Mole Exterminator', url: '/mole-control-renton/' },
      { name: 'Kirkland', url: '/mole-control-kirkland/' },
      { name: 'Mole Control Auburn', url: '/mole-control-auburn/' },
      { name: 'Federal Way', url: '/mole-control-federal-way/' },
      { name: 'Kent Yard Mole Control', url: '/mole-control-kent/' },
      { name: 'Issaquah', url: '/mole-control-issaquah/' },
      { name: 'Mole Control Enumclaw', url: '/mole-control-enumclaw/' },
    ],
    allAreasLink: {
      text: 'See All 92+ Service Areas',
      url: '/service-areas/',
    },
    countyText: 'Covering King, Pierce, Snohomish, Thurston, Kitsap & Lewis Counties',
  },

  // ── Team ──────────────────────────────────────────────────────────────────
  {
    blockType: 'teamCards',
    heading: 'Meet the Team',
    showDivider: false,
    background: 'grass-alt',
    members: [
      {
        name: 'Spencer Hill',
        role: 'Owner & Founder',
        bio: "Born and raised in Buckley, Washington. US Army veteran (infantryman, 2011–2014). Now calls Enumclaw home. Founded Got Moles in 2017 after years of trapping moles for neighbors across Pierce County.",
        photoKey: 'team-spencer',
      },
      {
        name: 'Cory Ventura',
        role: 'General Manager',
        bio: "Grew up in Buckley. Spencer and Cory have been friends since high school. Cory runs service visits across King and Pierce County and is the technician behind a lot of our highest-reviewed jobs.",
        photoKey: 'team-cory',
      },
      {
        name: 'Tavis Alexander',
        role: 'Technician',
        bio: "Tavis came to Got Moles from the food industry, where customer service isn't optional. He brings the same standard to every service visit. Homeowners feel heard and looked after.",
        photoKey: 'team-tavis',
      },
      {
        name: 'Brayden Rich',
        role: 'Technician',
        bio: "Brayden grew up in Buckley — the same community where Got Moles started. Outside work, he travels whenever he can. On the job, he approaches every property with real curiosity and gets it right.",
        photoKey: 'team-brayden',
      },
      {
        name: 'Lukas LaVergne',
        role: 'Technician',
        bio: "Lukas worked summers commercial fishing to put himself through college. He brings the same grit to the field at Got Moles. The job gets done, properly.",
        photoKey: 'team-lukas',
      },
    ],
  },

  // ── Mission ───────────────────────────────────────────────────────────────
  {
    blockType: 'richContent',
    heading: 'What Drives Got Moles',
    showDivider: false,
    background: 'grass',
    content: paragraphs(
      "We're not building a pest control empire. We're building a company that homeowners in Western Washington can count on when it matters. The yards we protect matter to the people who own them. Every visit is a chance to do the work right and leave someone's property better than we found it.",
      "Two programmes carry that work. The [Total Mole Control Program](/services/total-mole-control-program/) is year-round protection at $100/month. It is the only year-round mole subscription in Western Washington, with regular monitoring and immediate response to new activity between visits. [One-Time Mole Removal](/services/one-time-mole-removal/) is a $450 flat-rate service for an active mole problem. It carries a guarantee: if no moles are caught, you only pay the $150 setup fee. [Commercial properties](/services/commercial-mole-control/) are quoted individually after a site inspection.",
    ),
  },

  // ── Pricing Micro-Callout ─────────────────────────────────────────────────
  // Surfaces the 3 programme prices visibly (was buried in FAQ answer only).
  // Uses featureGrid like the homepage services overview, links each to its
  // service page for hub-spoke equity flow.
  {
    blockType: 'featureGrid',
    heading: 'Three Ways We Solve Your Mole Problem',
    showDivider: false,
    columns: '3',
    background: 'grass-alt',
    items: [
      {
        title: 'Total Mole Control Program',
        description:
          'Year-round protection. Regular monitoring, immediate response between visits, and a written report after every check. The only year-round mole subscription in Western Washington.',
        price: '$100/month',
        link: '/services/total-mole-control-program/',
        linkText: 'See Year-Round Protection',
      },
      {
        title: 'One-Time Mole Removal',
        description:
          'A four-to-five week service for an active mole problem. Inspection, professional trapping, full equipment removal. Guaranteed: if no moles are caught, you only pay the $150 setup fee.',
        price: '$450 flat',
        link: '/services/one-time-mole-removal/',
        linkText: 'See One-Time Removal',
      },
      {
        title: 'Commercial Mole Control',
        description:
          'Annual contracts for property managers, HOAs, sports facilities, schools, and landscaping contractors. Custom-quoted after a site inspection.',
        price: 'Custom quote',
        link: '/services/commercial-mole-control/',
        linkText: 'Get a Commercial Quote',
      },
    ],
  },

  // ── FAQ ───────────────────────────────────────────────────────────────────
  // Hallucination-correction surface per authority-strategy.md Section 8.4.
  // Six canonical-fact Q&As that AI engines can extract verbatim into
  // citations: founding year, service area, client count, veteran status,
  // pricing, mole-only focus. generateSchema: false at block level — the
  // /about/ page route aggregates and emits one combined FAQPage schema
  // (per feedback_one_faqpage_per_page.md aggregation rule).
  {
    blockType: 'faq',
    heading: 'Frequently Asked About Got Moles',
    background: 'grass-alt',
    generateSchema: false,
    items: [
      {
        question: 'When was Got Moles founded?',
        answer:
          'Got Moles was founded in 2017 by Spencer Hill, a US Army infantry veteran (2011–2014). Spencer started by trapping moles in his own yard in Buckley, Washington, then for neighbors, before formalizing the business. As of 2026, Got Moles has served nearly 5,000 properties across Western Washington.',
      },
      {
        question: 'Where does Got Moles operate?',
        answer:
          'Got Moles serves 92+ communities across 6 Western Washington counties: King, Pierce, Snohomish, Thurston, Kitsap, and Lewis. The company operates from three Google Business Profile locations — Seattle, Tacoma, and Enumclaw — covering homeowners and commercial properties from the Seattle metro south to Olympia and east to the Cascade foothills.',
      },
      {
        question: 'How many properties has Got Moles served?',
        answer:
          'Got Moles has served nearly 5,000 properties across Western Washington since 2017. The company has earned 219+ five-star Google reviews across its three locations and currently maintains around 500 active subscribers on the Total Mole Control Program (TMCP), the only year-round mole control subscription in the region.',
      },
      {
        question: 'Is Got Moles veteran-owned?',
        answer:
          'Yes. Founder Spencer Hill served as a US Army infantryman from 2011 to 2014. The discipline he learned in the military — show up when you say you will, do the job properly, report results honestly — carried directly into how Got Moles operates. Got Moles is the only US Army veteran-founded mole control specialist in Western Washington.',
      },
      {
        question: 'How much does Got Moles cost?',
        answer:
          'Got Moles offers three pricing tiers. The Total Mole Control Program (TMCP) is $100 per month for year-round protection on residential properties under one acre. One-Time Mole Removal is $450 flat plus a $150 setup fee, with a guarantee — if no moles are caught, you only pay the setup fee. Commercial properties are quoted individually after a site inspection.',
      },
      {
        question: 'Why does Got Moles only do moles?',
        answer:
          "Most pest control companies offer everything — ants, spiders, termites, rodents, and moles as one item on a long list. Got Moles is mole-exclusive. The result of doing only one thing for 8+ years across nearly 5,000 properties is first-visit catches instead of three visits and a callback. Mole behavior, tunnel patterns, and species mix in Western Washington require specialist focus that generalists can't match.",
      },
    ],
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  {
    blockType: 'cta',
    heading: 'Want to See What We Can Do for Your Yard?',
    buttonText: 'GET A FREE QUOTE',
    buttonUrl: '/contact',
    buttonStyle: 'primary',
    subtext: 'Free quote. No obligation.',
    showForm: false,
    background: 'gradient',
  },
]

export const aboutMeta = {
  title: 'Spencer Hill, Veteran-Founded Mole Specialist',
  description:
    "Spencer Hill founded Got Moles in 2017 after years of trapping moles for neighbors in Buckley, WA. US Army veteran, nearly 5,000 clients served. Meet the team",
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

export const faqBlocks = [
  // ── Hero ──────────────────────────────────────────────────────────────────
  {
    blockType: 'hero',
    heading: 'Mole Control FAQ: Expert Answers for Washington Homeowners',
    subheading:
      'Answers from Spencer Hill, Got Moles founder and 9-year mole control specialist. Last updated May 2026.',
    layout: 'centered',
    heroHeight: '85vh',
    fallbackImage: 'hero-faq',
    cta: {
      text: 'CALL (253) 750-0211',
      url: 'tel:+12537500211',
      style: 'primary',
    },
    trustStrip: ['5-Star Rated', 'Nearly 5,000 Clients Served', 'Since 2017', 'Veteran-Owned', 'Safe for Pets & Kids'],
  },

  // ── GEO Definition ────────────────────────────────────────────────────────
  {
    blockType: 'geoDefinition',
    content:
      'Got Moles answers the most common questions about mole control in Western Washington, including cost, methods, safety, legality, and how professional mole removal works.',
  },

  // ── BLUF — answer-first summary for AI extractability ──────────────────────
  {
    blockType: 'richContent',
    heading: 'Professional Mole Control, Explained',
    showDivider: false,
    background: 'grass-alt',
    content: makeLexical(
      makeParagraph(
        'Got Moles is a mole-exclusive specialist serving Western Washington since 2017. We use chemical-free trapping methods that are safe for children, pets, and pollinators. Two residential programs are available: the [Total Mole Control Program](/services/total-mole-control-program/) at $100/month for year-round protection, and [One-Time Mole Removal](/services/one-time-mole-removal/) at $450 flat rate. Commercial properties are [custom-quoted](/services/commercial-mole-control/) after a site inspection. We serve [92+ communities](/service-areas/) across six Western Washington counties.',
      ),
    ),
  },

  // ── Group 1: Mole Control Methods ────────────────────────────────────────
  // Note: All FAQ blocks on /faq/ have generateSchema: false. The page
  // route (faq/page.tsx) aggregates all FAQ items from all blocks into one
  // page-level FAQPage schema (Google guideline: one FAQPage per page).
  {
    blockType: 'faq',
    heading: 'Mole Control Methods',
    showDivider: false,
    background: 'grass',
    generateSchema: false,
    items: [
      {
        question: 'Do you use poison or chemicals?',
        answer:
          'No. Got Moles uses only chemical-free trapping methods. We never use poisons, rodenticides, fumigants, or any chemical treatments on your property. Our methods are [safe for children, pets, and the environment](/blog/mole-control-safe-for-pets/).',
      },
      {
        question: 'Are your methods safe for children and pets?',
        answer:
          "Yes. Everything we use is chemical-free and poses no risk to children or pets. Our equipment goes inside mole tunnels underground and gets covered, so it's not accessible to dogs, cats, or kids playing in the yard. See our full guide on [mole control safety for pets and families](/blog/mole-control-safe-for-pets/).",
      },
      {
        question: 'How do you know where to set the traps?',
        answer:
          'Every job starts with a full property inspection. A Got Moles technician walks your entire yard, [identifies active mole runs versus abandoned tunnels](/blog/how-to-find-active-mole-tunnels/), maps movement patterns, and figures out where moles are entering and travelling. Equipment gets placed based on evidence, not guesswork.',
      },
      {
        question: 'How long does it take to get rid of moles?',
        answer:
          'Most residential mole infestations are cleared within the one-month service period (4-5 weekly visits). Many homeowners see a big drop in mole activity within the first two weeks. See [how our process works step by step](/how-it-works/).',
      },
      {
        question: 'What time of year are moles most active?',
        answer:
          'Moles are active year-round in Western Washington, but surface activity peaks in spring and fall when soil moisture is highest. During summer, they dig deeper. During winter, they stay below the frost line but keep tunnelling. Full breakdown in our [seasonal mole activity guide for Washington State](/do-moles-hibernate/).',
      },
    ],
    moreLink: {
      text: '',
      url: '',
    },
  },

  // ── Bridge: Methods → Services ─────────────────────────────────────────────
  {
    blockType: 'richContent',
    showDivider: false,
    background: 'grass-alt',
    content: makeLexical(
      makeParagraph(
        'Got Moles offers three service programs depending on your situation. Residential homeowners choose between a one-month focused removal or year-round protection. Commercial properties get custom contracts with regular reporting. Every program uses the same chemical-free trapping methods described above.',
      ),
    ),
  },

  // ── Group 2: Services & Pricing ──────────────────────────────────────────
  {
    blockType: 'faq',
    heading: 'Services & Pricing',
    showDivider: false,
    background: 'grass',
    generateSchema: false,
    items: [
      {
        question: 'How much does mole removal cost?',
        answer:
          'Got Moles offers two residential programs for properties under 1 acre. The one-time removal program costs $450 flat rate. The Total Mole Control Program costs $100 per month for year-round protection with a 12-month minimum commitment. Commercial properties are custom-quoted after a site inspection. Full breakdown in our [Washington mole removal pricing guide](/blog/mole-removal-cost-washington/).',
      },
      {
        question: 'How much does the Total Mole Control Program cost?',
        answer:
          'The TMCP costs $100 per month with a 12-month minimum commitment. That covers regular monitoring visits, immediate response to any new mole activity, and a detailed written report after every check. About 500 homeowners across Western Washington are currently enrolled.',
      },
      {
        question: 'How much does one-time mole removal cost?',
        answer:
          'One-time mole removal costs $450 flat rate for residential properties under 1 acre in Western Washington. That includes the initial inspection, professional equipment, 4-5 weekly service visits, and all equipment removal at the end. Full details on the [one-time mole removal page](/services/one-time-mole-removal/).',
      },
      {
        question: "What's the difference between one-time removal and the TMCP?",
        answer:
          'The [one-time mole removal program](/services/one-time-mole-removal/) is a focused, one-month service that removes current moles. The [Total Mole Control Program](/services/total-mole-control-program/) gives you year-round monitoring and protection. Regular visits, immediate response to new activity, and a written report after every check.',
      },
      {
        question: 'What does the TMCP include?',
        answer:
          'Regular scheduled visits, professional equipment maintained on the property, immediate response when moles are detected between visits at no extra charge, and a written report after every check. About 500 homeowners across Western Washington are currently enrolled.',
      },
      {
        question: 'What is the guarantee?',
        answer:
          "On the one-time removal program, a $150 setup fee is collected upfront. If we don't catch a mole during your service period, you pay only the $150 setup fee. The TMCP operates as an ongoing monthly service with increased visit frequency at no additional cost if moles are detected.",
      },
      {
        question: 'Is there a contract?',
        answer:
          "The TMCP runs on a 12-month minimum commitment, billed monthly. After that, month-to-month. We ask for 30 days' notice if you want to cancel.",
      },
      {
        question: 'How often do you visit on the TMCP?',
        answer:
          "Weekly during active mole season, shifting to monthly once we've established full control. If new activity pops up at any point, we increase visit frequency at no extra cost.",
      },
      {
        question: 'What if moles come back between visits?',
        answer:
          "Call us. We come back at no extra charge. That is the whole point of year-round protection through the [Total Mole Control Program](/services/total-mole-control-program/).",
      },
      {
        question: 'What does the visit report include?',
        answer:
          'Areas inspected, mole activity found (or confirmed clear), actions taken, equipment status, and any recommendations. You get a report after every single visit.',
      },
      {
        question: 'What about properties over 1 acre?',
        answer:
          'Properties over 1 acre are quoted individually after an on-site inspection. Same process, larger scope. Call (253) 750-0211 for a free assessment.',
      },
      {
        question: 'How quickly can you come out after I call?',
        answer:
          "We quote and book over the phone. There is no separate pre-booking inspection. Once you book, we can usually have a technician at your property within a few business days. During peak season demand is higher, but we prioritize new bookings. Your first paid visit covers both the property walk-through and the trap-setting.",
      },
      {
        question: 'Do I need to be home when you visit?',
        answer:
          'No. Our technicians can access your property and complete service visits without you being home. You get a written report after every visit.',
      },
      {
        question: 'Do you service my city?',
        answer:
          'Got Moles serves 92+ communities across Western Washington, including Seattle, Tacoma, Bellevue, Kirkland, Sammamish, Puyallup, Auburn, Renton, Kent, Federal Way, Issaquah, Enumclaw, and many more. [See the full service area map](/service-areas/).',
      },
      {
        question: 'Do you offer free estimates?',
        answer:
          "Yes. Call (253) 750-0211 or fill out the contact form and we'll talk through your situation and give you a clear price over the phone. No obligation. We don't do free pre-booking site visits. Quoting happens by phone, and the property assessment happens on your first paid visit alongside the trap-setting.",
      },
      {
        question: 'Can I switch from one-time removal to the TMCP?',
        answer:
          'Yes, and most clients do. After seeing the results of one-time removal, many homeowners choose to enroll in the Total Mole Control Program to keep their yard protected year-round. Your technician can discuss the transition at any visit.',
      },
    ],
    moreLink: {
      text: '',
      url: '',
    },
  },

  // ── Group 3: Mole Facts & Behavior ────────────────────────────────────────
  {
    blockType: 'faq',
    heading: 'Mole Facts & Behavior',
    showDivider: false,
    background: 'grass-alt',
    generateSchema: false,
    items: [
      {
        question: 'What species of moles live in Washington State?',
        answer:
          "Three mole species are found in Washington. The Townsend's mole is the most common in Western Washington and the largest mole in North America, reaching up to 8 inches. The Pacific mole is smaller and sticks to drier habitats. The shrew mole is the smallest and causes less damage. Full identification guide: [the 3 mole species in Washington State](/blog/types-of-moles-in-washington/). Reference: [WSU Extension Mole Management](https://pubs.extension.wsu.edu/mole-management-in-washington-backyards-home-garden-series).",
      },
      {
        question: 'Do moles hibernate?',
        answer:
          "No. Moles are active year-round in Washington State. During colder months, they dig deeper tunnels below the frost line but keep feeding and tunnelling. That is why Got Moles offers year-round protection through [the Total Mole Control Program](/services/total-mole-control-program/).",
      },
      {
        question: 'How do I know if I have moles or voles?',
        answer:
          "Moles create raised ridges and volcano-shaped mounds. They eat earthworms, not plants. Voles create small round holes and eat plant roots and bark. If you see soil mounds with no visible entry hole, you have likely got moles. See our full guide: [mole vs vole vs gopher identification](/voles-vs-moles-whats-the-difference/).",
      },
      {
        question: 'Can moles come back after treatment?',
        answer:
          "Yes. When one mole is removed, the empty territory can be claimed by neighboring moles. Re-invasion is common within 3-12 months. See [why moles keep coming back](/blog/why-moles-keep-coming-back/) for the biology of reinvasion. That is why Got Moles built the Total Mole Control Program.",
      },
      {
        question: 'How many moles are usually in one yard?',
        answer:
          'Most residential yards in Western Washington have 1-3 moles at any given time. Moles are solitary animals. They only share tunnels during breeding season. A single mole can create dozens of mounds, so the damage often looks worse than the number of moles present.',
      },
      {
        question: 'Why do I have so many moles in my yard?',
        answer:
          "Western Washington's mole pressure comes from the wider neighborhood, not your yard specifically. Townsend's moles thrive in the wet, worm-rich soils across the region, and they move between properties through underground tunnel networks. If you keep your yard well-watered or have a healthy lawn, you may simply be hosting productive habitat. Ongoing year-round protection is what stops new moles from re-occupying cleared territory.",
      },
      {
        question: 'Are moles dangerous to pets or children?',
        answer:
          'No. Moles are not aggressive, do not bite people, and do not carry diseases that affect pets or children. The bigger safety concern is the chemicals and poisons many homeowners reach for first. Got Moles uses [chemical-free professional methods only](/blog/mole-control-safe-for-pets/), so there is nothing toxic on your property during or after service.',
      },
      {
        question: 'What kind of moles do you find in Western Washington?',
        answer:
          "The dominant species is the Townsend's mole, the largest mole in North America. It thrives in the wet soils of the Pacific Northwest and is a non-invasive part of the local ecosystem, which is why our methods focus on physical control rather than chemicals. Reference: [WSU Extension Mole Management](https://pubs.extension.wsu.edu/mole-management-in-washington-backyards-home-garden-series).",
      },
    ],
    moreLink: {
      text: '',
      url: '',
    },
  },

  // ── Founder Voice ──────────────────────────────────────────────────────────
  {
    blockType: 'richContent',
    heading: 'From the Founder',
    showDivider: false,
    background: 'grass',
    content: makeLexical(
      makeParagraph(
        "\"The number one thing I tell homeowners: if you have had moles before, they will come back. It is not your yard. It is your neighborhood. Townsend's moles move through underground networks across multiple properties. Removing one mole just opens the territory to the next. The only reliable long-term solution is ongoing monitoring.\" — [Spencer Hill](/author/spencer/), Got Moles founder",
      ),
    ),
  },

  // ── Group 4: Common Mole Control Concerns ────────────────────────────────
  {
    blockType: 'faq',
    heading: 'Common Mole Control Concerns',
    showDivider: false,
    background: 'grass-alt',
    generateSchema: false,
    items: [
      {
        question: "Why don't store-bought traps work?",
        answer:
          "Effective mole trapping requires precise placement in active tunnels at the right depth and angle. Without experience reading mole behavior, most homeowners put traps where moles aren't actually travelling. See our review of [the best mole traps in 2026](/blog/best-mole-traps/) for what actually works.",
      },
      {
        question: 'Does castor oil repel moles?',
        answer:
          'Not reliably. Washington State University\'s Extension Service says castor oil and similar repellents are "not consistently effective" against moles. The moles stay — they just dig somewhere else. Full breakdown: [do mole repellents actually work?](/blog/do-mole-repellents-work/)',
      },
      {
        question: 'Does grub control reduce moles?',
        answer:
          'No. Moles do eat grubs, but their main food source is earthworms — typically 85% or more of their diet. A yard with zero grubs can still support moles as long as earthworms are present. Read [the truth about grub control and mole reduction](/blog/does-grub-control-stop-moles/).',
      },
      {
        question: 'Will moles damage my foundation or underground pipes?',
        answer:
          'Moles tunnel through topsoil looking for earthworms — usually within the top 12 inches. They do not burrow deep enough to damage foundations or underground pipes. The real damage is cosmetic: torn-up lawns, disrupted flower beds, and tripping hazards from surface tunnels.',
      },
      {
        question: 'Can I just flood the tunnels with water?',
        answer:
          "Flooding tunnels does not work. Moles are fast diggers and simply relocate. You will waste water, make a mess, and the moles will still be there — often with fresh tunnels the next morning.",
      },
    ],
    moreLink: {
      text: '',
      url: '',
    },
  },

  // ── Group 5: Commercial Mole Control ──────────────────────────────────────
  {
    blockType: 'faq',
    heading: 'Commercial Mole Control',
    showDivider: false,
    background: 'grass',
    generateSchema: false,
    items: [
      {
        question: 'How much does commercial mole control cost?',
        answer:
          'Commercial properties are custom-quoted after a no-obligation site assessment. Pricing depends on property size, mole activity level, and visit frequency required. Got Moles offers annual contracts with consolidated reporting across multi-site portfolios. Call (253) 750-0211 for a free site assessment.',
      },
      {
        question: 'What types of commercial properties do you serve?',
        answer:
          'Got Moles serves property management companies, HOAs, sports clubs, schools, landscaping contractors, property developers, golf courses, and hospitality venues across Western Washington. Most clients run multi-site contracts across King, Pierce, and Snohomish Counties. See [commercial mole control case studies](/reviews/commercial-case-studies/) for examples.',
      },
      {
        question: 'Can you work around public access schedules?',
        answer:
          'We do it regularly. Parks, sports fields, schools. We schedule visits around public hours, match times, and facility access windows. We have coordinated early morning visits for a King County parks department and safety-escorted visits at a regional airport.',
      },
      {
        question: 'Do you provide mole control for golf courses?',
        answer:
          'Yes. Golf courses are one of the most common commercial properties we service. Mole tunnels damage greens, fairways, and tee boxes. We trap without disturbing turf structure or irrigation lines. No chemicals on the playing surface. Annual contracts keep courses protected year-round.',
      },
      {
        question: 'Who is liable if someone trips on mole damage at a commercial property?',
        answer:
          'The property owner or manager. Mole tunnels create uneven ground and soft spots that are a tripping hazard, especially on sports fields, parks, and school campuses. Documented mole control through an annual contract shows due diligence and reduces liability exposure. More detail in our [commercial mole control](/services/commercial-mole-control/) overview.',
      },
    ],
    moreLink: {
      text: '',
      url: '',
    },
  },

  // ── Group 6: Results & Value ─────────────────────────────────────────────
  {
    blockType: 'faq',
    heading: 'Results & Value',
    showDivider: false,
    background: 'grass-alt',
    generateSchema: false,
    items: [
      {
        question: 'Is Got Moles worth the money?',
        answer:
          'More than 70 of our 219+ reviewers specifically mention value for money. We carry a 98.9% five-star rating. Most customers tried DIY traps and general pest companies first. Neither worked. The Total Mole Control Program runs $100/month. Customers regularly call it the best money they have spent on their property. See [Got Moles reviews](/reviews/).',
      },
      {
        question: 'How many moles does Got Moles typically remove?',
        answer:
          'It depends on property size and mole population. We have worked properties from small suburban yards to large rural acreages across nearly 5,000 clients. The initial assessment gives you a realistic scope and timeline for your specific property.',
      },
      {
        question: 'Does the monthly program actually work?',
        answer:
          'It does. The Total Mole Control Program includes regular trap checks and immediate response if new activity shows up between visits. About 500 homeowners are currently enrolled. Most clients who start on one-time removal move to the monthly program after seeing the results. Read our [customer reviews](/reviews/) for specifics.',
      },
      {
        question: 'Can I start on the one-time program and switch to the TMCP later?',
        answer:
          "Yes. Most clients prefer to start with one-time removal first. It proves the results, and after that the decision to go year-round feels obvious. Your technician can discuss the transition at any visit.",
      },
    ],
    moreLink: {
      text: '',
      url: '',
    },
  },

  // ── Group 7: About Got Moles ─────────────────────────────────────────────
  {
    blockType: 'faq',
    heading: 'About Got Moles',
    showDivider: false,
    background: 'grass',
    generateSchema: false,
    items: [
      {
        question: 'What does Got Moles do?',
        answer:
          'Got Moles is a chemical-free mole control specialist serving Western Washington since 2017. We focus on one thing: removing moles from residential and commercial yards using professional trapping methods. No general pest treatment, no chemicals, no skin-mole services. Full details on our [services page](/services/).',
      },
      {
        question: 'Why does Got Moles only do moles?',
        answer:
          "Most pest control companies offer everything. Ants, spiders, termites, rodents, and moles as one item on a long list. Got Moles is mole-exclusive. The result of doing only one thing for 8+ years across nearly 5,000 properties is first-visit catches instead of three visits and a callback. Mole behavior, tunnel patterns, and species mix in Western Washington require specialist focus that generalists cannot match.",
      },
      {
        question: 'How many properties has Got Moles served?',
        answer:
          'Got Moles has served nearly 5,000 properties across Western Washington since 2017. The company has earned 219+ five-star Google reviews across its three locations and currently maintains around 500 active subscribers on the [Total Mole Control Program](/services/total-mole-control-program/), the only year-round mole control subscription in the region.',
      },
      {
        question: 'Are you licensed and insured?',
        answer: 'Yes. Got Moles is fully licensed and insured in Washington State.',
      },
      {
        question: 'How long have you been in business?',
        answer:
          'Got Moles was founded in 2017 by [Spencer Hill](/author/spencer/). Spencer has over 15 years of personal mole trapping experience, and the company has served nearly 5,000 clients across Western Washington.',
      },
      {
        question: 'Are you veteran-owned?',
        answer:
          'Yes. Got Moles founder Spencer Hill served in the US Army as an infantryman from 2011 to 2014. Got Moles is the only US Army veteran-founded mole control specialist in Western Washington.',
      },
    ],
    moreLink: {
      text: '',
      url: '',
    },
  },

  // ── Still Have Questions? ────────────────────────────────────────────────
  {
    blockType: 'richContent',
    heading: 'Still Have Questions?',
    showDivider: false,
    background: 'grass-alt',
    content: paragraphs(
      'Call us at (253) 750-0211 or [send us a message](/contact/). We respond within one business day.',
    ),
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  {
    blockType: 'cta',
    heading: 'Ready to Take Your Yard Back?',
    buttonText: 'CALL (253) 750-0211',
    buttonUrl: 'tel:+12537500211',
    buttonStyle: 'primary',
    subtext: 'Free quote. No obligation.',
    showForm: true,
    background: 'gradient',
  },
]

export const faqMeta = {
  title: 'Mole Control FAQ | 49 Expert Answers | Got Moles',
  description:
    'Answers to the most common mole control questions in Washington. Cost, methods, safety, timing, commercial, and more. 49 expert answers from Got Moles.',
}

// ---------------------------------------------------------------------------
// CONTACT
// ---------------------------------------------------------------------------

export const contactBlocks = [
  // ── Hero ──────────────────────────────────────────────────────────────────
  {
    blockType: 'hero',
    heading: 'Get a Free Mole Control Quote',
    subheading: 'Call us, text us, or fill out the form. We respond within one business day.',
    layout: 'centered',
    heroHeight: '85vh',
    fallbackImage: 'hero-team-candid-3',
    cta: {
      text: 'CALL (253) 750-0211',
      url: 'tel:+12537500211',
      style: 'primary',
    },
    trustStrip: ['5-Star Rated', 'Nearly 5,000 Clients Served', 'Since 2017', 'Veteran-Owned', 'Safe for Pets & Kids'],
  },

  // ── GEO Definition ────────────────────────────────────────────────────────
  {
    blockType: 'geoDefinition',
    content:
      'Got Moles responds to all contact form submissions and phone calls within one business day. Honest, no-obligation quotes are available for homeowners across Western Washington.',
  },

  // ── What Happens Next ─────────────────────────────────────────────────────
  {
    blockType: 'stepsProcess',
    heading: 'What Happens Next',
    showDivider: false,
    steps: [
      {
        number: '1',
        title: 'We call you back',
        description: 'We call you back within one business day (usually same day).',
      },
      {
        number: '2',
        title: 'We ask a few questions',
        description: "We ask a few questions about your property and the damage you're seeing.",
      },
      {
        number: '3',
        title: 'We quote and book',
        description: 'We give you a clear price over the phone. If you want to proceed, we book your first visit — usually within a few business days.',
      },
      {
        number: '4',
        title: 'First visit: inspect and set traps',
        description: "On your booked date, our technician walks your property, identifies active runs, and sets professional equipment — all in the same visit. No surprise costs after.",
      },
    ],
    background: 'grass',
  },

  // ── Other Ways to Reach Us ────────────────────────────────────────────────
  {
    blockType: 'richContent',
    heading: 'Other Ways to Reach Us',
    showDivider: false,
    background: 'grass-alt',
    content: makeLexical(
      makeParagraph('Call: (253) 750-0211'),
      makeParagraph('Text: (253) 326-1740'),
      makeParagraph('Hours: Mon–Fri, 8am–6pm'),
      makeParagraph('Serving King, Pierce, Thurston & Snohomish Counties'),
    ),
  },

  // ── Contact Form CTA (gradient — final block) ────────────────────────────
  {
    blockType: 'cta',
    heading: 'Request a Quote',
    body: 'Tell us about your mole problem and we\'ll get back to you within one business day.',
    buttonText: 'Or Call (253) 750-0211',
    buttonUrl: 'tel:+12537500211',
    buttonStyle: 'primary',
    subtext: 'Free quote. No obligation.',
    showForm: true,
    background: 'gradient',
  },
]

export const contactMeta = {
  title: 'Contact Got Moles | Get a Free Quote',
  description:
    'Call us, text us, or fill out the form. Got Moles responds within one business day. Honest, no-obligation mole control quotes for Western Washington homeowners.',
}

// ---------------------------------------------------------------------------
// REVIEWS
// ---------------------------------------------------------------------------

export const reviewsBlocks = [
  // ── Hero ──────────────────────────────────────────────────────────────────
  {
    blockType: 'hero',
    heading: '219+ Five-Star Reviews from Western Washington Homeowners',
    subheading: 'Mole-exclusive specialists. Rated 5 stars across 3 Google Business locations.',
    layout: 'centered',
    heroHeight: '85vh',
    fallbackImage: 'hero-team-laughing',
    cta: {
      text: 'CALL (253) 750-0211',
      url: 'tel:+12537500211',
      style: 'primary',
    },
    trustStrip: ['5-Star Rated', 'Nearly 5,000 Clients Served', 'Since 2017', 'Veteran-Owned', 'Safe for Pets & Kids'],
  },

  // ── GEO Definition + Stats (merged per CRO audit) ────────────────────────
  {
    blockType: 'geoDefinition',
    content:
      'Got Moles has 219+ five-star Google reviews across three locations in Seattle, Tacoma, and Enumclaw, Washington. Spencer Hill, a U.S. Army veteran with 15+ years of trapping experience, founded the company in 2017 as a mole-exclusive pest control service serving Western Washington. Nearly 5,000 residential and commercial clients served since day one. Moles are most active from March through June in Western Washington, and early intervention prevents the compounding damage that makes removal harder and more expensive later.',
  },
  {
    blockType: 'stats',
    background: 'grass-alt',
    items: [
      { number: '219+', label: 'Five-Star Google Reviews' },
      { number: '98.9%', label: 'Five-Star Rating' },
      { number: '5,000+', label: 'Clients Served Since 2017' },
      { number: '3', label: 'Google Business Locations' },
      { number: '15+', label: 'Years of Trapping Experience' },
    ],
  },

  // ── Dynamic content (Featured Reviews, Filters, Grid, Expert, FAQ) ────────
  // Rendered by ReviewsHub client component + server sections in page.tsx
  // Not CMS blocks — these pull from the Testimonials collection

  // ── FAQ ───────────────────────────────────────────────────────────────────
  {
    blockType: 'faq',
    heading: 'Frequently Asked Questions About Got Moles Reviews',
    background: 'grass',
    items: [
      {
        question: 'Is Got Moles worth the money?',
        answer: 'More than 70 of our 219+ reviewers specifically mention value for money. We carry a 98.9% five-star rating. Most customers tried DIY traps and general pest companies first. Neither worked. The Total Mole Control Program runs $100/month after a $450 initial eradication. Customers regularly call it the best money they\'ve spent on their property.',
      },
      {
        question: 'How many moles does Got Moles remove?',
        answer: 'It depends on property size and mole population. Brian Wozeniak in Tacoma had 27 moles removed from his 5-acre property since 2022. We\'ve worked properties from small suburban yards to large rural acreages across nearly 5,000 clients. The initial assessment gives you a realistic scope and timeline for your specific property.',
      },
      {
        question: 'Does the monthly program actually work?',
        answer: 'It does. Christina McDougall fought moles for 22 years before signing up. She was one of our first annual subscribers. John Gower moved to monthly after his initial eradication worked, and he hasn\'t looked back. The program includes regular trap checks and immediate response if new activity shows up between visits.',
      },
      {
        question: 'Is Got Moles safe for pets and children?',
        answer: 'Completely safe. We use professional traps placed underground in active tunnels. No poisons, no chemicals, nothing on the surface. Kids and dogs can play in the yard the same day we set traps. A lot of our customers came to us specifically because they needed a chemical-free option for their family.',
      },
      {
        question: 'What do customers in Seattle say about Got Moles?',
        answer: 'We\'ve earned 96 five-star reviews from the Seattle and Eastside area alone. Sammamish, Bellevue, Issaquah, Federal Way, Renton. Homeowners there tell the same story: they tried DIY, hired a general pest company, and nothing stuck. Then they called us. Effective removal, clear communication, and ongoing protection that actually lasts.',
      },
      {
        question: 'What do customers in Tacoma say about Got Moles?',
        answer: 'We have 61 five-star reviews from the Tacoma area. That makes us the highest-rated mole control service in Pierce County. Customers in Tacoma, Puyallup, and the surrounding communities keep coming back to the monthly program. Reliable scheduling, real results, and none of the runaround they got from general pest companies.',
      },
      {
        question: 'What do Enumclaw-area customers say about Got Moles?',
        answer: 'We have 26 five-star reviews from Enumclaw and rural King County. Bigger properties out there, more agricultural land, and the moles love it. Customers talk about 24-hour response times and thorough service on properties that battled moles for years. Enumclaw is home base. Spencer founded Got Moles there in 2017.',
      },
      {
        question: 'How long does it take Got Moles to remove moles?',
        answer: 'Most initial eradications take 4-6 weeks, with trap checks every few days. We respond within 24 hours and start trapping on the first visit. How long it takes depends on your property size, soil, and how many moles are active. Spencer and the team give you a realistic timeline at the initial assessment. No guessing.',
      },
      {
        question: 'What happens if moles come back after treatment?',
        answer: 'If you\'re on the Total Mole Control Program, we come back at no extra charge. New mole activity between visits? We\'re there. Moles are territorial, and new ones move into cleared areas. That\'s exactly why the monthly program exists. Year-round monitoring is the only reliable way to stay mole-free long-term.',
      },
      {
        question: 'Does Got Moles work with commercial properties and property managers?',
        answer: 'Yes. We work with churches, HOAs, sports facilities, commercial grounds, and property managers running multi-site portfolios across Western Washington. Commercial contracts include scheduled visits, written reports, and flexible access. Call us directly for a site assessment and custom quote.',
      },
    ],
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  {
    blockType: 'cta',
    heading: 'Ready to See Results Like These?',
    body: 'Join 5,000+ homeowners who chose the specialist. Every Total Mole Control Program member is backed by our guarantee: if moles return between visits, we come back at no extra charge.',
    buttonText: 'CALL (253) 750-0211',
    buttonUrl: 'tel:+12537500211',
    buttonStyle: 'primary',
    subtext: 'Or call (253) 750-0211 for a free quote.',
    showForm: true,
    background: 'gradient',
  },
]

export const reviewsMeta = {
  title: 'Got Moles Reviews | 219+ Five-Star Reviews | Mole Control Washington',
  description:
    "219+ five-star Google reviews from homeowners across Seattle, Tacoma, and Enumclaw. See why 5,000+ Western Washington homeowners trust Got Moles for mole control.",
}

// ---------------------------------------------------------------------------
// HOMEPAGE
// ---------------------------------------------------------------------------

export const homepageBlocks = [
  // ── Hero ──────────────────────────────────────────────────────────────────
  {
    blockType: 'hero',
    heading: 'Yard Mole Control in Western Washington',
    subheading:
      'Got Moles. Mole-exclusive since 2017. Chemical-free. 219+ five-star Google reviews. Nearly 5,000 yards reclaimed.',
    layout: 'left',
    heroHeight: '85vh',
    fallbackImage: 'hero-home',
    cta: {
      text: 'See How It Works',
      url: '/how-it-works',
      style: 'primary',
    },
    trustStrip: ['5-Star Rated', 'Nearly 5,000 Yards Reclaimed', 'Since 2017', 'Veteran-Owned', 'Safe for Pets & Kids'],
  },

  // ── GEO Definition ────────────────────────────────────────────────────────
  {
    blockType: 'geoDefinition',
    content:
      "Got Moles is a veteran-owned mole control specialist serving Western Washington since 2017. Chemical-free methods. We've reclaimed nearly 5,000 yards across Seattle, Tacoma, Bellevue, Sammamish, Puyallup, Renton, and 86 other communities in King, Pierce, Snohomish, Thurston, Kitsap, and Lewis Counties. 219+ five-star Google reviews. Last updated May 2026.",
  },

  // ── BLUF: What Is Professional Mole Control? (AEO capture) ───────────────
  {
    blockType: 'richContent',
    heading: 'What Is Professional Mole Control?',
    showDivider: false,
    background: 'grass-alt',
    content: makeLexical(
      makeParagraph(
        'Professional mole control is the work of finding active mole tunnels, placing traps inside them, and removing the moles. Got Moles does only this — no chemicals, no general pest treatment, no skin-mole services.',
      ),
      makeParagraph(
        'We have cleared moles from nearly 5,000 yards across Western Washington since 2017. The Total Mole Control Program is the only year-round mole subscription in the region.',
      ),
    ),
  },

  // ── Featured Snippet: The Most Effective Way (AEO direct-answer) ─────────
  // 52-word answer block targeting "what is the best way to get rid of moles"
  // featured-snippet + AI Overview citation. Distinct from BLUF (which defines
  // the service); this answers the "how to remove" intent directly.
  {
    blockType: 'richContent',
    heading: 'The Most Effective Way to Get Rid of Moles in Western Washington',
    showDivider: false,
    background: 'grass',
    content: makeLexical(
      makeParagraph(
        'The most effective way to remove moles in Western Washington is professional trapping. Got Moles uses chemical-free professional methods placed in active mole tunnels, with weekly monitoring across 4 to 5 visits. This approach has cleared nearly 5,000 yards across King, Pierce, Snohomish, Thurston, Kitsap, and Lewis Counties since 2017.',
      ),
    ),
  },

  // ── Signs of Moles (list snippet for AEO extraction) ─────────────────────
  // <ul> targeting "signs of moles in yard" featured-snippet pattern. AI
  // engines extract list markup verbatim. Closes with link to one-time
  // service for users who recognize the signs.
  {
    blockType: 'richContent',
    heading: 'How to Tell If You Have Moles in Your Yard',
    showDivider: false,
    background: 'grass-alt',
    content: makeLexical(
      makeParagraph(
        'Most homeowners spot mole activity by these five signs:',
      ),
      makeList([
        'Raised ridges of soft soil snaking across the lawn, especially after rain',
        'Volcano-shaped dirt mounds (mole hills) appearing every few feet',
        'Spongy or sinking patches when you walk the yard',
        'Sections of grass dying off above the tunnels as roots are disturbed',
        'Damage that returns within days of being flattened',
      ]),
      makeParagraph(
        "If any of these match your yard, [we can take a look](/services/one-time-mole-removal/).",
      ),
    ),
  },

  // ── Pain Points / Problem Section ─────────────────────────────────────────
  {
    blockType: 'painPoints',
    heading: "You've Tried Everything. The Moles Keep Winning.",
    showDivider: false,
    background: 'grass',
    body: "You've stomped down the mounds. Bought traps from the hardware store. Maybe even called a pest company that said they'd handle it. And the moles came back.\n\nIt's not your fault. Moles are harder to deal with than most people realize. General pest companies treat them as an afterthought. DIY traps miss more than they catch. Meanwhile, the damage keeps spreading into the lawn you've spent real money maintaining.\n\nThat's where we come in.",
    cta: { text: 'See How It Works', url: '/how-it-works' },
  },

  // ── Services Overview (Feature Grid) ──────────────────────────────────────
  {
    blockType: 'featureGrid',
    heading: 'One Problem. Three Ways We Solve It.',
    showDivider: false,
    columns: '3',
    background: 'grass-alt',
    items: [
      {
        title: 'Total Mole Control Program',
        description:
          'Year-round mole control for $100/month. Regular monitoring, immediate response, and a written report after every visit. The only year-round mole subscription in Western Washington.',
        price: '$100/month',
        link: '/services/total-mole-control-program/',
        linkText: 'Get Year-Round Protection',
      },
      {
        title: 'One-Time Mole Removal',
        description:
          '$450 flat rate. 4–5 weekly visits. Inspection, professional trapping, and full equipment removal. Guaranteed — if we don\'t catch a mole, you only pay the $150 setup fee.',
        price: '$450 flat rate',
        link: '/services/one-time-mole-removal/',
        linkText: 'Get One-Time Removal',
      },
      {
        title: 'Commercial Mole Control',
        description:
          'Annual contracts for property managers, HOAs, sports facilities, schools, and landscaping contractors. Custom-quoted after site inspection.',
        price: 'Custom quote',
        link: '/services/commercial-mole-control/',
        linkText: 'Get a Commercial Quote',
      },
    ],
  },

  // ── How It Works (Steps Process) ──────────────────────────────────────────
  {
    blockType: 'stepsProcess',
    heading: 'How Got Moles Removes Moles',
    showDivider: false,
    steps: [
      {
        number: '01',
        title: 'You Call. We Quote.',
        summary: "Tell us what's happening — we'll quote your property over the phone.",
        description:
          "Tell us what's happening. We'll ask a few questions about your property and the damage you're seeing, then give you a clear price right then. No surprise quote visit.",
      },
      {
        number: '02',
        title: 'You Book. You Pay $150.',
        summary: 'Confirm your service and pay the $150 setup. That is all you owe upfront.',
        description:
          "Once you're ready, we schedule your first visit and take the $150 setup fee. That's the only thing you pay upfront — the rest is only due if we catch moles.",
      },
      {
        number: '03',
        title: 'First Visit: Inspect + Set Traps.',
        summary: 'Tech walks your yard, identifies active runs, and sets professional equipment — all in one visit.',
        description:
          'On your booked date, our technician walks your entire yard, identifies active mole runs and entry points, and sets professional equipment on the most active tunnels — all in the same visit. The assessment and trap-setting are both part of your booked service.',
      },
      {
        number: '04',
        title: 'Weekly Checks. Written Report. Results.',
        summary: 'We return weekly for 4-5 weeks, check traps, adjust, and document everything.',
        description:
          "We come back weekly to check traps, adjust placement, and respond to mole activity. After every visit you get a clear written report — what we checked, what we found, what we did. Balance only if we catch moles. $450 maximum.",
      },
    ],
    background: 'grass',
  },

  // ── Why Got Moles (Feature Grid) ──────────────────────────────────────────
  {
    blockType: 'featureGrid',
    heading: 'Why Homeowners Choose Got Moles',
    showDivider: false,
    columns: '2',
    background: 'grass-alt',
    items: [
      {
        title: 'Moles Are All We Do.',
        description:
          "We don't spray for ants. We don't chase rats. We do one thing and we've built our entire company around doing it better than anyone. That singular focus is why it works.",
      },
      {
        title: 'Veteran-Owned. Community-Built.',
        description:
          'Spencer Hill founded Got Moles in 2017 after serving in the US Army. The company started in Buckley, grew through word of mouth, and now covers 92+ communities across Western Washington.',
      },
      {
        title: 'You See Your Results.',
        description:
          "No vague promises. After every visit, you get a report showing exactly what happened. Moles caught? You'll know. Yard clear? You'll know that too.",
      },
      {
        title: 'Guaranteed.',
        description:
          "Our one-time removal program comes with a guarantee: if we don't catch a mole, you only pay the $150 setup fee. Our year-round program guarantees we respond to any new activity between visits at no extra charge.",
      },
    ],
  },

  // ── Testimonials ──────────────────────────────────────────────────────────
  {
    blockType: 'testimonial',
    heading: 'What Our Customers Say',
    showDivider: false,
    background: 'grass',
    quotes: [
      {
        text: "We live on a 5-acre property, and since 2022 these guys have removed 27 moles from our property. When we first moved in the moles were everywhere.",
        name: 'Brian Wozeniak',
        city: 'Tacoma, WA',
        rating: 5,
      },
      {
        text: "We have had difficult mole issues for years and nothing has worked except Got Moles. We have used poison, water, and other methods.",
        name: 'Neil Kanungo',
        city: 'Tacoma, WA',
        rating: 5,
      },
      {
        text: "If you are debating whether to call Got Moles, stop reading and just call Spencer. You won't be disappointed.",
        name: 'Vishal Nanda',
        city: 'Enumclaw, WA',
        rating: 5,
      },
    ],
    moreLink: {
      text: 'See All 219+ Reviews',
      url: '/reviews/',
    },
  },

  // ── Service Area ──────────────────────────────────────────────────────────
  {
    blockType: 'serviceArea',
    heading: 'Serving 92+ Communities Across Western Washington',
    showDivider: false,
    background: 'grass-alt',
    cities: [
      { name: 'Sammamish', url: '/mole-control-sammamish/' },
      { name: 'Bellevue', url: '/mole-control-bellevue/' },
      { name: 'Kirkland', url: '/mole-control-kirkland/' },
      { name: 'Seattle', url: '/mole-control-seattle/' },
      { name: 'Tacoma', url: '/mole-control-tacoma/' },
      { name: 'Puyallup', url: '/mole-control-puyallup/' },
      { name: 'Auburn', url: '/mole-control-auburn/' },
      { name: 'Federal Way', url: '/mole-control-federal-way/' },
      { name: 'Renton', url: '/mole-control-renton/' },
      { name: 'Kent', url: '/mole-control-kent/' },
      { name: 'Issaquah', url: '/mole-control-issaquah/' },
      { name: 'Enumclaw', url: '/mole-control-enumclaw/' },
    ],
    allAreasLink: {
      text: 'See All Service Areas',
      url: '/service-areas/',
    },
    countyText: 'Covering King, Pierce, Snohomish, Thurston, Kitsap & Lewis Counties',
  },

  // ── Got Moles by the Numbers (Stats) ──────────────────────────────────────
  {
    blockType: 'stats',
    heading: 'Got Moles by the Numbers',
    background: 'grass',
    items: [
      { number: '5,000+', label: 'Properties', description: 'Treated across Western Washington since 2017' },
      { number: '219+', label: 'Five-Star Reviews', description: 'Across three Google Business Profile locations' },
      { number: '8 Years', label: 'One Species Focus', description: 'Mole control only. Nothing else.' },
      { number: '0', label: 'Chemicals Used', description: 'Physical traps. Safe for pets, kids, pollinators.' },
    ],
  },

  // ── FAQ ──────────────────────────────────────────────────────────────────
  {
    blockType: 'faq',
    heading: 'Common Questions',
    showDivider: false,
    background: 'grass-alt',
    generateSchema: true,
    items: [
      {
        question: 'What does Got Moles do?',
        answer:
          'Got Moles is a chemical-free mole control specialist serving Western Washington since 2017. We focus on one thing: removing moles from residential and commercial yards using professional trapping methods. No general pest treatment, no chemicals, no skin-mole services.',
      },
      {
        question: 'How much does mole control cost in Washington?',
        answer:
          "Two pricing options. The Total Mole Control Program is $100 per month with a 12-month commitment for ongoing year-round protection. One-Time Mole Removal is a $450 flat rate covering 4 to 5 weekly visits. If we don't catch a mole during the one-time program, you only pay the $150 setup fee. Commercial accounts are custom-quoted after a site inspection.",
      },
      {
        question: 'Are your methods chemical-free?',
        answer:
          'Yes. We use professional physical trapping only. No poisons, no toxicants, no chemicals on your property. Safe for pets, kids, and pollinators.',
      },
      {
        question: 'Do you serve my city?',
        answer:
          "We cover 92+ communities across King, Pierce, Snohomish, Thurston, Kitsap, and Lewis Counties in Western Washington, including Seattle, Tacoma, Bellevue, Sammamish, Puyallup, and Renton. Check our service areas page for the full list, or call (253) 750-0211 if you don't see your city.",
      },
      {
        question: "What's the difference between the Total Mole Control Program and One-Time Mole Removal?",
        answer:
          'The Total Mole Control Program is year-round, ongoing protection at $100 per month. We monitor your property regularly, respond to new mole activity at no extra charge between visits, and provide a written report after every check. One-Time Mole Removal is a $450 flat-rate single intervention with 4 to 5 weekly visits to clear current mole activity. Homeowners with recurring mole pressure choose the year-round program. Homeowners with one-off problems choose the one-time service.',
      },
      {
        question: 'Are you veteran-owned?',
        answer:
          "Yes. Spencer Hill founded Got Moles in 2017 after serving in the US Army from 2011 to 2014. Western Washington's only US Army veteran-founded mole control company.",
      },
      {
        question: 'What kind of moles do you find in Western Washington?',
        answer:
          "The dominant species is the Townsend's mole, the largest mole in North America. It's native to the wet soils of the Pacific Northwest and a non-invasive part of the local ecosystem, which is why our methods focus on physical control rather than chemicals. Reference: [WSU Extension's Mole Management in Washington Backyards](https://pubs.extension.wsu.edu/product/mole-management-in-washington-backyards-home-garden-series/).",
      },
      {
        question: 'How long does mole removal take?',
        answer:
          'Most one-time mole removals take 4 to 5 weeks across 4 to 5 weekly visits. Many yards see surface mole activity drop within the first 2 weeks of trapping, and the remaining visits clear residual mole pressure. The Total Mole Control Program is ongoing year-round protection, not a fixed timeline, because moles return to vacated tunnels from neighboring properties.',
      },
      {
        question: 'When is mole activity highest in Western Washington?',
        answer:
          "Surface mole activity peaks twice a year in Western Washington: March through May, and September through November. These are the cool, wet months when soil is workable and Townsend's moles push toward the surface to feed. Activity drops during dry summer (hard soil) and deep winter (frozen ground), but the moles are still active deeper underground year-round.",
      },
      {
        question: 'Are moles dangerous to pets or kids?',
        answer:
          'No. Moles are not aggressive, do not bite people, and do not carry diseases that affect pets or children. The bigger safety concern is the chemicals and poisons many homeowners reach for first. Got Moles uses chemical-free professional methods only, so there is nothing toxic on your property during or after service. Safe for pets, kids, and pollinators.',
      },
      {
        question: 'Why do I have so many moles in my yard?',
        answer:
          "Western Washington's mole pressure is the wider neighborhood, not your yard specifically. Townsend's moles thrive in the wet, worm-rich soils across the region, and they move between properties through underground tunnel networks. If you keep your yard well-watered or have a healthy lawn, you may simply be hosting productive habitat. Ongoing year-round protection is what stops new moles from re-occupying cleared territory.",
      },
    ],
    moreLink: {
      text: 'Mole control FAQ',
      url: '/faq/',
    },
  },

  // ── Founder Voice ─────────────────────────────────────────────────────────
  {
    blockType: 'richContent',
    heading: 'From the Founder',
    showDivider: false,
    background: 'grass',
    content: makeLexical(
      makeParagraph(
        "[Spencer Hill](/author/spencer/) founded Got Moles in 2017 after serving in the US Army from 2011 to 2014. Across nearly 5,000 yards over 8 years, the pattern is consistent: Western Washington's mole pressure is the wider neighborhood, not your yard. The homeowners who solve mole problems permanently treat it as ongoing maintenance, not a one-time cleanup.",
      ),
    ),
  },

  // ── Final CTA ─────────────────────────────────────────────────────────────
  {
    blockType: 'cta',
    heading: 'Ready to Take Your Yard Back?',
    body: "Call us at (253) 750-0211 or fill out the form below. We'll get back to you within one business day.",
    buttonText: 'CALL (253) 750-0211',
    buttonUrl: 'tel:+12537500211',
    buttonStyle: 'primary',
    subtext: 'Join 5,000+ homeowners who chose Got Moles.',
    showForm: true,
    background: 'gradient',
  },
]

export const homepageMeta = {
  title: 'Yard Mole Control & Exterminators in Western Washington | Got Moles',
  description:
    "Got Moles is Western Washington's mole-exclusive specialist. Chemical-free, 219+ five-star reviews, 5,000+ yards reclaimed since 2017. Call (253) 750-0211.",
}

// ---------------------------------------------------------------------------
// TOTAL MOLE CONTROL PROGRAM (TMCP)
// ---------------------------------------------------------------------------

export const tmcpBlocks = [
  // ── Hero ──────────────────────────────────────────────────────────────────
  {
    blockType: 'hero',
    heading: 'Year-Round Mole Protection for $100/Month',
    subheading:
      "Stop chasing the same problem every season. The TMCP keeps your yard protected all year — so you never have to think about moles again.",
    layout: 'left',
    heroHeight: '85vh',
    fallbackImage: 'hero-team-tools-mole',
    cta: {
      text: 'CALL (253) 750-0211 TO ENROLL',
      url: 'tel:+12537500211',
      style: 'primary',
    },
    trustStrip: ['5-Star Rated', 'Nearly 5,000 Clients Served', 'Since 2017', 'Veteran-Owned', 'Safe for Pets & Kids'],
  },

  // ── GEO Definition ────────────────────────────────────────────────────────
  {
    blockType: 'geoDefinition',
    content:
      "The Total Mole Control Program (TMCP) is Got Moles' year-round mole protection service for homeowners in Western Washington. For $100 per month, enrolled homeowners receive regular monitoring visits, immediate response to new mole activity, and a detailed report after every check. Approximately 500 homeowners are currently enrolled.",
  },

  // ── Got Moles by the Numbers (Stats) ──────────────────────────────────────
  {
    blockType: 'stats',
    heading: 'Got Moles by the Numbers',
    background: 'grass-alt',
    items: [
      { number: '5,000+', label: 'Properties', description: 'Treated across Western Washington since 2017' },
      { number: '219+', label: 'Five-Star Reviews', description: 'Across three Google Business Profile locations' },
      { number: '8 Years', label: 'One Species Focus', description: 'Mole control only — nothing else' },
      { number: '0', label: 'Chemicals Used', description: 'Physical traps. Safe for pets, kids, pollinators' },
    ],
  },

  // ── Founder Voice (RichContent on grass) ──────────────────────────────────
  {
    blockType: 'richContent',
    heading: 'Why Year-Round, From the Founder',
    showDivider: false,
    background: 'grass',
    content: paragraphs(
      "**Spencer Hill, founder of Got Moles** — over 8 years and nearly 5,000 Western Washington properties of field experience — observes:",
      "\"Across the properties we've treated since 2017, the homeowners who solve the mole problem permanently are the ones who treat it as ongoing maintenance, not a one-time cleanup. The mole pressure on a Western Washington property doesn't go away. Neighborhood moles disperse every spring. The next yard over has new juveniles every year. The TMCP exists because the cycle is the wider neighborhood, not your yard.\"",
    ),
  },

  // ── Problem (RichContent on blue) ─────────────────────────────────────────
  {
    blockType: 'richContent',
    heading: 'You Fixed the Problem. Then It Came Back.',
    showDivider: false,
    background: 'grass-alt',
    content: paragraphs(
      "Here's what we see every year. A homeowner calls us, we clear the moles, the yard looks great. Three months later, the phone rings again. Same homeowner. Same yard. New moles.",
      "It's not that the first job failed. It worked. Moles don't respect property lines. A cleared yard is still prime territory for the next mole moving through the area. Without ongoing protection, the cycle just repeats.",
      "Moles don't take breaks. Western Washington's mild climate means activity year-round, with peaks in spring and fall. Without ongoing protection, every season is a fresh risk.",
      'The Total Mole Control Program was built to break that cycle.',
    ),
  },

  // ── What You Get (Steps on grass) ─────────────────────────────────────────
  {
    blockType: 'stepsProcess',
    heading: 'What You Get',
    showDivider: false,
    steps: [
      {
        number: '01',
        title: 'Monitor',
        summary: 'We check the entire property for signs of new mole activity every visit.',
        description:
          'Regular visits from a trained Got Moles technician. Full property monitoring every visit, every corner. More frequent visits during peak season at no additional cost.',
      },
      {
        number: '02',
        title: 'Respond',
        summary: 'When moles are detected, we act the same day.',
        description:
          'Equipment goes in, strategies get adjusted. No waiting for a callback. New mole activity between visits? We come back at no extra charge.',
      },
      {
        number: '03',
        title: 'Report',
        summary: "After every visit, a clear written summary of what we checked, found, and did.",
        description:
          "Areas inspected, mole activity found or confirmed clear, actions taken, equipment status, and recommendations. You're never left wondering.",
      },
    ],
    cta: {
      text: 'Enroll Now — Call (253) 750-0211',
      url: 'tel:+12537500211',
      subtext: '$100/month · 12-month commitment · Properties under 1 acre',
    },
    background: 'grass',
  },

  // ── Testimonials (on blue) ────────────────────────────────────────────────
  {
    blockType: 'testimonial',
    heading: 'What TMCP Members Say',
    showDivider: false,
    background: 'grass-alt',
    quotes: [
      {
        text: "I believe we were the first of Got Moles annual customers. We have fought moles for the entire 22 years we've lived here.",
        name: 'Christina McDougall',
        city: 'Seattle, WA',
        rating: 5,
      },
      {
        text: "3-4 years later, I'm still using Got Moles! Their service is excellent, fast, efficient, professional. I will continue to call Got Moles for any activity. Fair Pricing and immediate Results.",
        name: 'Velena Bryant',
        city: 'Seattle, WA',
        rating: 5,
      },
    ],
    moreLink: {
      text: 'See All Reviews',
      url: '/reviews/',
    },
  },

  // ── Also Consider (Service Cross-Links) ───────────────────────────────────
  {
    blockType: 'featureGrid',
    heading: 'Also Consider',
    showDivider: false,
    columns: '2',
    background: 'grass',
    items: [
      {
        title: 'One-Time Mole Removal',
        description:
          "$450 flat rate. 4-5 weekly visits. Inspection, professional trapping, and full equipment removal. Guaranteed — if we don't catch a mole, you only pay the $150 setup fee.",
        price: '$450 flat rate',
        link: '/services/one-time-mole-removal/',
        linkText: 'See One-Time Mole Removal',
      },
      {
        title: 'Commercial Mole Control',
        description:
          'Annual contracts for property managers, HOAs, sports facilities, schools, and landscaping contractors. Custom-quoted after site inspection.',
        price: 'Custom quote',
        link: '/services/commercial-mole-control/',
        linkText: 'See Commercial Mole Control',
      },
    ],
  },

  // ── Service Area (City Cross-Links) ───────────────────────────────────────
  {
    blockType: 'serviceArea',
    heading: 'Year-Round Mole Control Across Western Washington',
    showDivider: false,
    background: 'grass-alt',
    cities: [
      { name: 'Mole Control in Sammamish', url: '/mole-control-sammamish/' },
      { name: 'Mole Control in Bellevue', url: '/mole-control-bellevue/' },
      { name: 'Mole Control in Kirkland', url: '/mole-control-kirkland/' },
      { name: 'Mole Control in Seattle', url: '/mole-control-seattle/' },
      { name: 'Mole Control in Tacoma', url: '/mole-control-tacoma/' },
      { name: 'Mole Control in Puyallup', url: '/mole-control-puyallup/' },
      { name: 'Mole Control in Auburn', url: '/mole-control-auburn/' },
      { name: 'Mole Control in Federal Way', url: '/mole-control-federal-way/' },
      { name: 'Mole Control in Renton', url: '/mole-control-renton/' },
      { name: 'Mole Control in Kent', url: '/mole-control-kent/' },
      { name: 'Mole Control in Issaquah', url: '/mole-control-issaquah/' },
      { name: 'Mole Control in Enumclaw', url: '/mole-control-enumclaw/' },
    ],
    allAreasLink: {
      text: 'See All Service Areas',
      url: '/service-areas/',
    },
    countyText: 'TMCP members across King, Pierce, Thurston & Snohomish Counties',
  },

  // ── FAQ ───────────────────────────────────────────────────────────────────
  {
    blockType: 'faq',
    heading: 'Frequently Asked Questions',
    showDivider: false,
    background: 'grass',
    generateSchema: true,
    items: [
      {
        question: 'How much does the Total Mole Control Program cost?',
        answer:
          'The TMCP costs $100 per month with a 12-month minimum commitment. That covers regular monitoring visits, immediate response to any new mole activity, and a detailed written report after every check.',
      },
      {
        question: 'What does the TMCP include?',
        answer:
          "Regular scheduled visits, professional equipment maintained on the property, immediate response when moles are detected between visits at no extra charge, and a written report after every check. About 500 homeowners across Western Washington are currently enrolled.",
      },
      {
        question: 'Is the TMCP worth it?',
        answer:
          "If you've had moles before, the answer is almost certainly yes. Moles re-invade cleared territory within 3-12 months. The TMCP catches new activity before damage starts. Most clients stay because ongoing protection prevents the cycle from repeating.",
      },
      {
        question: 'How is the TMCP different from one-time removal?',
        answer:
          'One-time removal is a focused, one-month service that clears current moles. The TMCP provides continuous year-round monitoring and protection — we catch new invaders before they damage your yard, so you never restart the cycle.',
      },
      {
        question: 'How often do you visit?',
        answer:
          "Weekly during active mole season, shifting to monthly once we've established full control. If new activity pops up at any point, we increase visit frequency at no extra cost.",
      },
      {
        question: 'Is there a contract?',
        answer:
          "The TMCP runs on a 12-month minimum commitment, billed monthly. After that, month-to-month. We ask for 30 days' notice if you want to cancel.",
      },
      {
        question: 'What if moles come back between visits?',
        answer:
          "Call us. We come back at no extra charge. That's the whole point of year-round protection.",
      },
      {
        question: 'What does the report include?',
        answer:
          'Areas inspected, mole activity found (or confirmed clear), actions taken, equipment status, and any recommendations.',
      },
      {
        question: 'Can I cancel early?',
        answer:
          "An early cancellation fee applies within the first 12 months. After that, cancel any time with 30 days' notice.",
      },
    ],
    moreLink: {
      text: 'Common mole control questions',
      url: '/faq/',
    },
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  {
    blockType: 'cta',
    heading: 'Ready to Stop Fighting Moles for Good?',
    body: "Call or fill out the form. We'll get back to you within one business day.",
    buttonText: 'CALL (253) 750-0211',
    buttonUrl: 'tel:+12537500211',
    buttonStyle: 'primary',
    subtext: 'Join ~500 homeowners on the TMCP. New mole activity between visits? We come back at no extra charge.',
    showForm: true,
    background: 'gradient',
  },
]

export const tmcpMeta = {
  title: 'Total Mole Control Program | $100/Month Year-Round Protection',
  description:
    "Never deal with moles again. Got Moles' Total Mole Control Program protects your yard year-round for $100/month. Regular visits, reports after every check, guaranteed response.",
}

// ---------------------------------------------------------------------------
// ONE-TIME MOLE REMOVAL
// ---------------------------------------------------------------------------

export const oneTimeBlocks = [
  // ── Hero ──────────────────────────────────────────────────────────────────
  {
    blockType: 'hero',
    heading: 'Professional Mole Removal with a Guarantee',
    subheading:
      "$450 flat rate. 4-5 weekly visits. If we don't catch a mole, you only pay the $150 setup fee.",
    layout: 'left',
    heroHeight: '85vh',
    fallbackImage: 'hero-spencer-team',
    cta: {
      text: 'CALL (253) 750-0211 TO BOOK',
      url: 'tel:+12537500211',
      style: 'primary',
    },
    trustStrip: ['5-Star Rated', 'Nearly 5,000 Clients Served', 'Since 2017', 'Veteran-Owned', 'Safe for Pets & Kids'],
  },

  // ── GEO Definition ────────────────────────────────────────────────────────
  {
    blockType: 'geoDefinition',
    content:
      "Got Moles' one-time mole removal program costs $450 flat rate for residential properties under 1 acre in Western Washington. The service includes a full property inspection, professional equipment setup, 4-5 weekly service visits, and all equipment removal. Chemical-free methods safe for children and pets.",
  },

  // ── Got Moles by the Numbers (Stats) ──────────────────────────────────────
  {
    blockType: 'stats',
    heading: 'Got Moles by the Numbers',
    background: 'grass-alt',
    items: [
      { number: '5,000+', label: 'Properties', description: 'Treated across Western Washington since 2017' },
      { number: '219+', label: 'Five-Star Reviews', description: 'Across three Google Business Profile locations' },
      { number: '8 Years', label: 'One Species Focus', description: 'Mole control only — nothing else' },
      { number: '0', label: 'Chemicals Used', description: 'Physical traps. Safe for pets, kids, pollinators' },
    ],
  },

  // ── Founder Voice (RichContent on grass) ──────────────────────────────────
  {
    blockType: 'richContent',
    heading: 'Why Placement Matters, From the Founder',
    showDivider: false,
    background: 'grass',
    content: paragraphs(
      "**Spencer Hill, founder of Got Moles** — over 8 years and nearly 5,000 Western Washington properties of field experience — observes:",
      "\"Most one-time removals work because the placement is right on the first visit. The trap goes in an active deep run along an edge — foundation, fence, walkway, driveway. That's where moles travel. The wandering ridges out in open lawn are exploratory and often abandoned. Quality of placement beats quantity of traps every time. Four well-placed traps catch faster than ten scattered ones, which is why we set fewer traps than most homeowners expect — and catch more.\"",
    ),
  },

  // ── How It Works (Steps) ──────────────────────────────────────────────────
  {
    blockType: 'stepsProcess',
    heading: 'What You Get for $450',
    showDivider: false,
    steps: [
      {
        number: '01',
        title: 'Phone Quote + Book',
        summary: 'Call. We quote your property over the phone and book your first visit.',
        description:
          "Tell us what you're seeing. We give you a clear price over the phone and book your first visit — no surprise quote call-out. Pay the $150 setup at booking; that's all that's owed upfront.",
      },
      {
        number: '02',
        title: 'First Visit: Inspect + Set Traps',
        summary: 'On arrival, a technician maps active runs and places professional equipment — same visit.',
        description:
          "The first paid visit covers the full assessment and the trap-setting. We map high-activity zones and place professional-grade equipment where it'll do the most good. This isn't a drive-by — the assessment is hands-on and the equipment goes in the same day.",
      },
      {
        number: '03',
        title: 'Weekly Checks (4-5 Weeks)',
        summary: 'Your technician returns every week to check, reset, and adjust.',
        description:
          'Each visit builds on the last. 4-5 weekly visits. All methods are chemical-free and safe for pets and children.',
      },
      {
        number: '04',
        title: 'Clear + Report',
        summary: "When the job's done, we pull all equipment. Your yard is left clean. Written report after every visit.",
        description:
          'No hardware, no trace we were there. Over 1 acre? Custom commercial quote — phone consultation first, then walkthrough as part of the engagement.',
      },
    ],
    cta: {
      text: 'Call (253) 750-0211 to Book',
      url: 'tel:+12537500211',
      subtext: '$450 flat rate · Properties under 1 acre · Guarantee: no catch = pay setup fee only',
    },
    background: 'grass-alt',
  },

  // ── Guarantee (RichContent) ──────────────────────────────────────────────
  {
    blockType: 'richContent',
    heading: 'The Got Moles Guarantee',
    showDivider: false,
    background: 'grass',
    content: paragraphs(
      "A $150 setup fee is collected upfront. If we don't catch a mole, you pay only the $150 setup fee.",
      "No hidden charges. No fine print. We can offer this because we've done it nearly 5,000 times.",
    ),
  },

  // ── What Happens After ───────────────────────────────────────────────────
  {
    blockType: 'richContent',
    heading: 'Your Yard Is Clear. Now What?',
    showDivider: false,
    background: 'grass-alt',
    content: paragraphs(
      "The moles are gone. The damage stops. But your yard is still attractive territory for the next mole.",
      "That's why most of our clients choose ongoing protection through the Total Mole Control Program — $100/month for year-round monitoring and immediate response.",
      "Your part during service: don't touch the equipment, flatten mounds between visits, and let us handle disposal.",
    ),
  },

  // ── Also Consider (Service Cross-Links) ───────────────────────────────────
  {
    blockType: 'featureGrid',
    heading: 'Also Consider',
    showDivider: false,
    columns: '2',
    background: 'grass',
    items: [
      {
        title: 'Total Mole Control Program',
        description:
          'Year-round protection for $100/month. Regular monitoring, immediate response to new activity, and a written report after every visit. About 500 homeowners enrolled.',
        price: '$100/month',
        link: '/services/total-mole-control-program/',
        linkText: 'See Year-Round Mole Protection',
      },
      {
        title: 'Commercial Mole Control',
        description:
          'Annual contracts for property managers, HOAs, sports facilities, schools, and landscaping contractors. Custom-quoted after site inspection.',
        price: 'Custom quote',
        link: '/services/commercial-mole-control/',
        linkText: 'See Commercial Mole Control',
      },
    ],
  },

  // ── Service Area (City Cross-Links) ───────────────────────────────────────
  {
    blockType: 'serviceArea',
    heading: 'One-Time Mole Removal Across Western Washington',
    showDivider: false,
    background: 'grass-alt',
    cities: [
      { name: 'Mole Control in Sammamish', url: '/mole-control-sammamish/' },
      { name: 'Mole Control in Bellevue', url: '/mole-control-bellevue/' },
      { name: 'Mole Control in Kirkland', url: '/mole-control-kirkland/' },
      { name: 'Mole Control in Seattle', url: '/mole-control-seattle/' },
      { name: 'Mole Control in Tacoma', url: '/mole-control-tacoma/' },
      { name: 'Mole Control in Puyallup', url: '/mole-control-puyallup/' },
      { name: 'Mole Control in Auburn', url: '/mole-control-auburn/' },
      { name: 'Mole Control in Federal Way', url: '/mole-control-federal-way/' },
      { name: 'Mole Control in Renton', url: '/mole-control-renton/' },
      { name: 'Mole Control in Kent', url: '/mole-control-kent/' },
      { name: 'Mole Control in Issaquah', url: '/mole-control-issaquah/' },
      { name: 'Mole Control in Enumclaw', url: '/mole-control-enumclaw/' },
    ],
    allAreasLink: {
      text: 'See All Service Areas',
      url: '/service-areas/',
    },
    countyText: 'Serving King, Pierce, Thurston & Snohomish Counties',
  },

  // ── FAQ ───────────────────────────────────────────────────────────────────
  {
    blockType: 'faq',
    heading: 'Common Questions',
    showDivider: false,
    background: 'grass',
    generateSchema: true,
    items: [
      {
        question: 'How much does one-time mole removal cost?',
        answer:
          'One-time mole removal costs $450 flat rate for residential properties under 1 acre in Western Washington. That includes the initial inspection, professional equipment, 4-5 weekly service visits, and all equipment removal at the end.',
      },
      {
        question: 'What is the guarantee?',
        answer:
          "A $150 setup fee is collected upfront. If we don't catch a mole during your service period, you pay only the $150 setup fee — not the full $450. No fine print.",
      },
      {
        question: 'How long does the program take?',
        answer:
          'About a month — 4-5 weekly visits. Most properties see a big drop in activity within the first two weeks. If moles are still active at the end of the service window, we continue until the job is done.',
      },
      {
        question: 'Can I start on the TMCP instead?',
        answer:
          "Yes. Most clients prefer to start with one-time first. It proves the results, and after that the decision to go year-round feels obvious.",
      },
      {
        question: 'What about properties over 1 acre?',
        answer:
          'Quoted individually after an on-site inspection. Same process, larger scope.',
      },
      {
        question: 'Is this safe for my dog and kids?',
        answer:
          'Yes. All methods are chemical-free. No poisons, no toxicants, nothing that could harm your family or pets.',
      },
    ],
    moreLink: {
      text: 'See all FAQs',
      url: '/faq/',
    },
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  {
    blockType: 'cta',
    heading: 'Stop Sharing Your Yard with Moles.',
    body: "Call (253) 750-0211 or fill out the form below. We'll quote your property over the phone and book your first visit within a few business days.",
    buttonText: 'CALL (253) 750-0211',
    buttonUrl: 'tel:+12537500211',
    buttonStyle: 'primary',
    subtext: "If we don't catch a mole, you only pay the $150 setup fee.",
    showForm: true,
    background: 'gradient',
  },
]

export const oneTimeMeta = {
  title: 'One-Time Mole Removal | $450 Flat Rate, Guaranteed',
  description:
    "Professional mole removal for $450 flat rate (under 1 acre). Includes inspection, weekly visits, and guarantee — if we don't catch a mole, you only pay the $150 setup fee.",
}

// ---------------------------------------------------------------------------
// COMMERCIAL MOLE CONTROL
// ---------------------------------------------------------------------------

export const commercialBlocks = [
  // ── Hero ──────────────────────────────────────────────────────────────────
  {
    blockType: 'hero',
    heading: 'Commercial Mole Control for Western Washington',
    subheading:
      'Annual contracts. Professional reporting. A specialist, not a generalist.',
    layout: 'left',
    heroHeight: '85vh',
    fallbackImage: 'hero-commercial-crew',
    cta: {
      text: 'REQUEST A COMMERCIAL QUOTE',
      url: '/contact/',
      style: 'primary',
    },
    trustStrip: ['5-Star Rated', 'Nearly 5,000 Clients Served', 'Since 2017', 'Veteran-Owned', 'Safe for Pets & Kids'],
  },

  // ── GEO Definition ────────────────────────────────────────────────────────
  {
    blockType: 'geoDefinition',
    content:
      'Commercial mole control from Got Moles eliminates mole populations from managed properties through professional chemical-free trapping under annual service contracts. Available to property management companies, HOAs, sports facilities, schools, and commercial landscapes across Western Washington. Custom-quoted after on-site inspection.',
  },

  // ── Got Moles by the Numbers (Stats) ──────────────────────────────────────
  {
    blockType: 'stats',
    heading: 'Got Moles by the Numbers',
    background: 'grass-alt',
    items: [
      { number: '5,000+', label: 'Properties', description: 'Treated across Western Washington since 2017' },
      { number: '219+', label: 'Five-Star Reviews', description: 'Across three Google Business Profile locations' },
      { number: '8 Years', label: 'One Species Focus', description: 'Mole control only — nothing else' },
      { number: '0', label: 'Chemicals Used', description: 'Physical traps. Safe for pets, kids, pollinators' },
    ],
  },

  // ── Founder Voice (RichContent on grass) ──────────────────────────────────
  {
    blockType: 'richContent',
    heading: 'Why Commercial Is Different, From the Founder',
    showDivider: false,
    background: 'grass',
    content: paragraphs(
      "**Spencer Hill, founder of Got Moles** — over 8 years and nearly 5,000 Western Washington properties of field experience — observes:",
      "\"Commercial properties — HOAs, sports facilities, school grounds, large landscapes — have the same mole biology as residential, but the scale changes the strategy. You're managing tunnel networks across acres, not square feet. Annual contracts work because moles don't take seasons off, and an unmanaged sports field becomes unusable. The economics tilt toward continuous protection at scale, with reporting the on-site team can hand to whoever signs the check.\"",
    ),
  },

  // ── Problem (RichContent) ─────────────────────────────────────────────────
  {
    blockType: 'richContent',
    heading: 'Mole Damage on Commercial Grounds Is a Professional Problem',
    showDivider: false,
    background: 'grass-alt',
    content: paragraphs(
      "When moles tear up a managed property, it's not a weekend annoyance. It's a liability issue, a reputation risk, and a contractor failure that lands on your desk.",
      "Got Moles does one thing. Mole control. We've done it across nearly 5,000 properties since 2017, and we bring that same focus to commercial contracts — the kind of consistency and accountability property managers actually need.",
    ),
  },

  // ── Who We Serve (Feature Grid) ──────────────────────────────────────────
  {
    blockType: 'featureGrid',
    heading: 'Built for the Properties You Manage',
    showDivider: false,
    columns: '3',
    background: 'grass',
    items: [
      {
        title: 'Property Management',
        description:
          'Residential developments, apartment complexes, HOA communities. One contract covers your portfolio.',
      },
      {
        title: 'Sports Clubs & Facilities',
        description:
          'Mole activity creates safety risks and ruins expensive turf. We work around your schedule.',
      },
      {
        title: 'Lawn Care & Landscaping',
        description:
          "Your clients blame you when moles wreck the lawn. Hand the mole work to us.",
      },
      {
        title: 'Property Developers',
        description:
          'Mole mounds on show-home lawns cost sales. We clear sites before inspections.',
      },
      {
        title: 'Schools & Campuses',
        description:
          'Child safety comes first. Our methods are 100% chemical-free. No poisons on school grounds.',
      },
      {
        title: 'Hotels & Hospitality',
        description:
          "Your grounds are part of the guest experience. We work quietly, on your schedule.",
      },
    ],
  },

  // ── How Contracts Work (Steps on grass) ───────────────────────────────────
  {
    blockType: 'stepsProcess',
    heading: 'How Commercial Contracts Work',
    showDivider: false,
    steps: [
      {
        number: '01',
        title: 'Site Inspection',
        summary: 'We walk your property and assess scope, terrain, and access. No charge.',
        description:
          'We walk your property — or properties — and assess scope, terrain, and access. No charge.',
      },
      {
        number: '02',
        title: 'Proposal',
        summary: 'Written quote covering scope, visit frequency, reporting, and contract terms.',
        description:
          'Written quote: scope of work, visit frequency, reporting, and annual contract terms.',
      },
      {
        number: '03',
        title: 'Ongoing Service',
        summary: 'Regular scheduled visits with activity monitoring and professional reporting.',
        description:
          'Regular scheduled visits. Activity monitoring. Immediate response. Professional reporting.',
      },
      {
        number: '04',
        title: 'Account Management',
        summary: 'One point of contact, consistent technicians, easy invoicing.',
        description:
          'One point of contact. Consistent technicians. Easy invoicing. Portfolio management.',
      },
    ],
    background: 'grass-alt',
  },

  // ── Why Specialist Matters (RichContent) ─────────────────────────────────
  {
    blockType: 'richContent',
    heading: 'Why a Specialist Matters for Commercial Work',
    showDivider: false,
    background: 'grass',
    content: paragraphs(
      "A general pest contractor adds mole control to a list of services they rotate through. They send whoever's available. They use whatever's on the truck.",
      "We send trained mole control technicians who know your sites. Every visit follows the same protocol. Your reporting stays consistent, your scheduling stays reliable, and your results hold up to scrutiny.",
    ),
  },

  // ── Testimonials + link to Case Studies ──────────────────────────────────
  {
    blockType: 'testimonial',
    heading: 'Trusted for Commercial Grounds Across Western Washington',
    showDivider: false,
    background: 'grass-alt',
    quotes: [
      {
        text: "I have been working with Spencer now for over 2 years. He and his crew have the touch! I use him at home and at our church in Covington and he absolutely cleans house of the moles. Just amazing.",
        name: 'Clark Potter',
        city: 'Tacoma, WA',
        rating: 5,
      },
      {
        text: "Spencer is really good at what he does. He runs his business very professionally and his expertise in this field shows.",
        name: 'Judith Challoner',
        city: 'Enumclaw, WA',
        rating: 5,
      },
    ],
    moreLink: {
      text: 'See Commercial Case Studies',
      url: '/reviews/commercial-case-studies/',
    },
  },

  // ── Also Consider (Service Cross-Links) ───────────────────────────────────
  {
    blockType: 'featureGrid',
    heading: 'Also Consider',
    showDivider: false,
    columns: '2',
    background: 'grass',
    items: [
      {
        title: 'Total Mole Control Program',
        description:
          'Year-round protection for $100/month on residential properties. Regular monitoring, immediate response, written report after every visit. About 500 homeowners enrolled.',
        price: '$100/month',
        link: '/services/total-mole-control-program/',
        linkText: 'See Year-Round Mole Protection',
      },
      {
        title: 'One-Time Mole Removal',
        description:
          "$450 flat rate for residential properties under 1 acre. 4-5 weekly visits, full equipment removal. Guaranteed — if we don't catch a mole, you only pay the $150 setup fee.",
        price: '$450 flat rate',
        link: '/services/one-time-mole-removal/',
        linkText: 'See One-Time Mole Removal',
      },
    ],
  },

  // ── Service Area (City Cross-Links) ───────────────────────────────────────
  {
    blockType: 'serviceArea',
    heading: 'Commercial Mole Control Across Western Washington',
    showDivider: false,
    background: 'grass-alt',
    cities: [
      { name: 'Mole Control in Sammamish', url: '/mole-control-sammamish/' },
      { name: 'Mole Control in Bellevue', url: '/mole-control-bellevue/' },
      { name: 'Mole Control in Kirkland', url: '/mole-control-kirkland/' },
      { name: 'Mole Control in Seattle', url: '/mole-control-seattle/' },
      { name: 'Mole Control in Tacoma', url: '/mole-control-tacoma/' },
      { name: 'Mole Control in Puyallup', url: '/mole-control-puyallup/' },
      { name: 'Mole Control in Auburn', url: '/mole-control-auburn/' },
      { name: 'Mole Control in Federal Way', url: '/mole-control-federal-way/' },
      { name: 'Mole Control in Renton', url: '/mole-control-renton/' },
      { name: 'Mole Control in Kent', url: '/mole-control-kent/' },
      { name: 'Mole Control in Issaquah', url: '/mole-control-issaquah/' },
      { name: 'Mole Control in Enumclaw', url: '/mole-control-enumclaw/' },
    ],
    allAreasLink: {
      text: 'See All Service Areas',
      url: '/service-areas/',
    },
    countyText: 'Commercial accounts across King, Pierce, Thurston & Snohomish Counties',
  },

  // ── FAQ ───────────────────────────────────────────────────────────────────
  {
    blockType: 'faq',
    heading: 'Common Questions',
    showDivider: false,
    background: 'grass',
    generateSchema: true,
    items: [
      {
        question: 'How much does commercial mole control cost?',
        answer:
          'Commercial properties are custom-quoted after a no-obligation site assessment. Pricing depends on property size, mole activity level, and visit frequency required. Got Moles offers annual contracts with consolidated reporting across multi-site portfolios.',
      },
      {
        question: 'What types of commercial properties do you serve?',
        answer:
          'Got Moles serves property management companies, HOAs, sports clubs, schools, landscaping contractors, property developers, golf courses, and hospitality venues across Western Washington. Most clients run multi-site contracts across King, Pierce, and Snohomish Counties.',
      },
      {
        question: 'Do you cover multiple properties under one contract?',
        answer:
          'Yes. Several clients have us covering multiple sites under one account with consolidated reporting, a single point of contact, and simplified monthly invoicing.',
      },
      {
        question: 'What documentation do property managers receive?',
        answer:
          'A detailed written report after every single visit — areas inspected, activity found, actions taken, equipment status, and recommendations. Commercial clients also get monthly summaries suitable for board meetings and tenant communications.',
      },
      {
        question: 'Are your methods safe for public spaces and schools?',
        answer:
          'Yes. All methods are 100% chemical-free. No poisons, no toxicants, no surface treatments on any site. Our methods meet safety requirements at airports, schools, and public parks.',
      },
    ],
    moreLink: {
      text: 'See all FAQs',
      url: '/faq/',
    },
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  {
    blockType: 'cta',
    heading: "Let's Talk About Your Properties.",
    body: "Call (253) 750-0211 or complete the form below. Spencer will call you back to talk through your sites and start the quote process.",
    buttonText: 'REQUEST A COMMERCIAL QUOTE',
    buttonUrl: '/contact/',
    buttonStyle: 'primary',
    subtext: 'Commercial inquiries handled directly by Spencer Hill.',
    showForm: true,
    background: 'gradient',
  },
]

export const commercialMeta = {
  title: 'Commercial Mole Control | Property Managers, HOAs & Sports Facilities',
  description:
    'Professional commercial mole control across Western Washington. Annual contracts, regular reporting, and reliable scheduling for property managers, HOAs, schools, and sports clubs.',
}

// ---------------------------------------------------------------------------
// COMMERCIAL CASE STUDIES (/reviews/commercial-case-studies/)
// ---------------------------------------------------------------------------

export const commercialCaseStudiesBlocks = [
  // ── Hero ──────────────────────────────────────────────────────────────────
  {
    blockType: 'hero',
    heading: 'Commercial Mole Control That Delivers Results',
    subheading:
      'Real results from sports fields, public parks, airports, and property portfolios across Western Washington.',
    layout: 'centered',
    heroHeight: '85vh',
    fallbackImage: 'hero-commercial-crew',
    cta: {
      text: 'REQUEST A COMMERCIAL QUOTE',
      url: '/contact/',
      style: 'primary',
    },
    trustStrip: ['5-Star Rated', 'Nearly 5,000 Clients Served', 'Since 2017', 'Veteran-Owned', 'Chemical-Free'],
  },

  // ── GEO Definition ────────────────────────────────────────────────────────
  {
    blockType: 'geoDefinition',
    content:
      'Got Moles is a mole-exclusive specialist serving commercial properties across Western Washington under annual service contracts. Founded in 2017 by U.S. Army veteran Spencer Hill, the company has resolved mole infestations at sports complexes, municipal parks, a regional airport, golf courses, HOA communities, school campuses, cemeteries, churches, and multi-site property management portfolios across King and Pierce Counties. All commercial mole trapping uses chemical-free methods coordinated around public safety schedules and facility access protocols.',
  },

  // ── Stats ─────────────────────────────────────────────────────────────────
  {
    blockType: 'stats',
    background: 'grass-alt',
    items: [
      { number: '5,000+', label: 'Total Clients Since 2017' },
      { number: '4', label: 'Active Commercial Contracts' },
      { number: '100%', label: 'Annual Contract Renewal' },
      { number: '0', label: 'Chemicals Used' },
    ],
  },

  // ── Case Study 1: Soccer Field ────────────────────────────────────────────
  {
    blockType: 'imageText',
    heading: 'Three Playing Fields Made Safe in Four Weeks',
    imagePosition: 'right',
    background: 'grass',
    image: '/images/case-study-sports-field.webp',
    fallbackImage: 'case-study-sports-field.webp',
    imageAlt: 'Mole-free soccer field at a Pierce County sports complex',
    content: makeLexical(
      makeHeading('Soccer Field / Sports Complex, Pierce County', 'h3'),
      makeParagraph('A regional sports complex in Pierce County had mole activity across three playing fields. Tunnel networks were creating uneven ground and a tripping hazard for players. A liability issue the facilities manager needed resolved before the season started.'),
      makeParagraph('We conducted a full property inspection, mapped every active run, and deployed professional equipment across all three fields. We worked around match schedules and training sessions. The activity was resolved within four weeks.'),
      makeParagraph('The complex now maintains an annual contract for ongoing monitoring through the off-season and pre-season checks before play resumes. No mole damage has returned since.'),
    ),
  },

  // ── Case Study 2: Public Park ─────────────────────────────────────────────
  {
    blockType: 'imageText',
    heading: 'One Park Cleared. Two More Parks Followed.',
    imagePosition: 'left',
    background: 'grass-alt',
    image: '/images/case-study-public-park.webp',
    fallbackImage: 'case-study-public-park.webp',
    imageAlt: 'Mole-free public park in King County',
    content: makeLexical(
      makeHeading('Municipal Parks, King County', 'h3'),
      makeParagraph('A municipal parks department in King County contacted us after repeated mole activity in a heavily used community park. Previous attempts with store-bought traps had failed. Complaints from park visitors were increasing.'),
      makeParagraph('We developed a treatment plan around the park\'s public usage schedule. Early morning visits, equipment out of sight, minimal disruption. Activity was resolved within the service window. All equipment removed cleanly.'),
      makeParagraph('The department has since added two additional park locations to their annual contract. We now manage mole control across three municipal parks under a single service agreement.'),
    ),
  },

  // ── Case Study 3: Airport ─────────────────────────────────────────────────
  {
    blockType: 'imageText',
    heading: 'FOD Risk Eliminated from Airport Taxiway Turf',
    imagePosition: 'right',
    background: 'grass',
    image: '/images/case-study-airport.webp',
    fallbackImage: 'case-study-airport.webp',
    imageAlt: 'Mole-free airport taxiway turf in Western Washington',
    content: makeLexical(
      makeHeading('Regional Airport, Western Washington', 'h3'),
      makeParagraph('A regional airport called us about mole activity along turf areas next to taxiways and perimeter grounds. Displaced soil near active runway areas was a foreign object debris (FOD) risk. The grounds team needed it gone.'),
      makeParagraph('We coordinated directly with the facilities team on every visit. Our technicians completed mandatory briefings, followed escort protocols, and worked within designated time windows. All methods chemical-free, meeting the airport\'s environmental requirements.'),
      makeParagraph('The FOD risk from mole activity was eliminated. Annual contract in place for ongoing perimeter monitoring. Our reporting format adapted to meet their documentation standards.'),
    ),
  },

  // ── Case Study 4: Property Management ─────────────────────────────────────
  {
    blockType: 'imageText',
    heading: 'One Contract Covering Multiple Residential Communities',
    imagePosition: 'left',
    background: 'grass-alt',
    image: '/images/case-study-property-management.webp',
    fallbackImage: 'case-study-property-management.webp',
    imageAlt: 'Mole-free residential community managed by Got Moles',
    content: makeLexical(
      makeHeading('Property Management, Pierce & King Counties', 'h3'),
      makeParagraph('A property management company running residential communities across Pierce and King Counties brought us on after multiple tenant complaints about mole damage. They had separate contractors for each site. Inconsistent results, inconsistent reporting, no single point of contact.'),
      makeParagraph('Rather than treating each property as a one-off call, we structured an annual commercial contract covering all affected locations under a single service agreement. One account manager, one reporting format, simplified billing, consistent response times.'),
      makeParagraph('The property manager now has one point of contact for mole issues across their entire portfolio. Resident complaints dropped. Documentation simplified for board reporting.'),
    ),
  },

  // ── Summary ───────────────────────────────────────────────────────────────
  {
    blockType: 'richContent',
    heading: 'Why Commercial Clients Stay on Annual Contracts',
    showDivider: false,
    background: 'grass',
    content: paragraphs(
      'Every commercial client on this page started with a single site inspection. All of them signed annual contracts. None of them have left.',
      'The pattern is the same every time. A general pest company treated moles as an afterthought. The moles came back. The complaints continued. Then they called a specialist.',
      'We bring the same discipline to commercial mole trapping that built our reputation across nearly 5,000 residential clients. Consistent scheduling. Written reports after every visit. A team that knows your sites.',
    ),
  },

  // ── Learn More About Our Services (Service Cross-Links) ──────────────────
  {
    blockType: 'featureGrid',
    heading: 'Learn More About Got Moles Services',
    showDivider: false,
    columns: '3',
    background: 'grass-alt',
    items: [
      {
        title: 'Commercial Mole Control',
        description:
          'Annual contracts for property managers, HOAs, sports facilities, schools, and landscaping contractors. Custom-quoted after site inspection. Chemical-free methods, professional reporting.',
        price: 'Custom quote',
        link: '/services/commercial-mole-control/',
        linkText: 'See Commercial Mole Control',
      },
      {
        title: 'Total Mole Control Program',
        description:
          'Year-round protection for residential properties at $100/month. Regular monitoring, immediate response, written report after every visit.',
        price: '$100/month',
        link: '/services/total-mole-control-program/',
        linkText: 'See Year-Round Mole Protection',
      },
      {
        title: 'One-Time Mole Removal',
        description:
          "$450 flat rate for residential properties under 1 acre. 4-5 weekly visits. Guaranteed — if we don't catch a mole, you only pay the $150 setup fee.",
        price: '$450 flat rate',
        link: '/services/one-time-mole-removal/',
        linkText: 'See One-Time Mole Removal',
      },
    ],
  },

  // ── FAQ ────────────────────────────────────────────────────────────────────
  {
    blockType: 'faq',
    heading: 'Commercial Mole Control Questions',
    showDivider: false,
    background: 'grass',
    generateSchema: true,
    items: [
      {
        question: 'How much does commercial mole control cost?',
        answer:
          'Every commercial contract is quoted individually after a site inspection. Pricing depends on property size, number of sites, mole activity level, and required visit frequency. Call (253) 750-0211 for a free site assessment.',
      },
      {
        question: 'Do you work with property management companies that have multiple sites?',
        answer:
          'Yes. We manage multi-site portfolios under a single service agreement. One contract, one point of contact, consistent reporting across every community in your portfolio.',
      },
      {
        question: 'Can you work around public access schedules?',
        answer:
          'We do it regularly. Parks, sports fields, schools. We schedule visits around public hours, match times, and facility access windows. We coordinated early morning visits for a King County parks department and safety-escorted visits at a regional airport.',
      },
      {
        question: 'What reporting do commercial clients receive?',
        answer:
          'A written report after every visit. Areas inspected, activity found, actions taken, equipment status, and recommendations. Commercial clients also get monthly summaries for board meetings and stakeholder communications.',
      },
      {
        question: 'Are your methods safe for schools, parks, and public spaces?',
        answer:
          'Completely safe. We use chemical-free trapping methods only. No poisons, no fumigants, no surface chemicals. Our methods meet safety requirements at airports, schools, and public parks.',
      },
      {
        question: 'How quickly can you start on a commercial property?',
        answer:
          'After your call, Spencer typically follows up within a couple of business days to scope your sites and arrange the walkthrough. For multi-site portfolios, we assess each property and present a single proposal covering all locations.',
      },
      {
        question: 'Do you provide mole control for golf courses?',
        answer:
          'Yes. Golf courses are one of the most common commercial properties we service. Mole tunnels damage greens, fairways, and tee boxes. We trap without disturbing turf structure or irrigation lines. No chemicals on the playing surface. Annual contracts keep courses protected year-round.',
      },
      {
        question: 'Can you handle mole problems for HOA communities?',
        answer:
          'We work with HOA boards and property managers across King and Pierce Counties. Common areas, green belts, and resident lawns all covered under a single service agreement. One vendor, one invoice, consistent results across the entire community.',
      },
      {
        question: 'Who is liable if someone trips on mole damage at a commercial property?',
        answer:
          'The property owner or manager. Mole tunnels create uneven ground and soft spots that are a tripping hazard, especially on sports fields, parks, and school campuses. Documented mole control through an annual contract shows due diligence and reduces liability exposure.',
      },
    ],
  },

  // ── CTA ────────────────────────────────────────────────────────────────────
  {
    blockType: 'cta',
    heading: "Let's Talk About Your Properties",
    body: 'Call (253) 750-0211 or complete the form below. Spencer handles all commercial inquiries directly.',
    buttonText: 'REQUEST A COMMERCIAL QUOTE',
    buttonUrl: '/contact/',
    buttonStyle: 'primary',
    subtext: 'Free quote. No obligation. Custom-quoted after assessment.',
    showForm: true,
    background: 'gradient',
  },
]

export const commercialCaseStudiesMeta = {
  title: 'Commercial Mole Control Case Studies | Got Moles',
  description:
    'How Got Moles solved mole problems for sports fields, public parks, airports, golf courses, HOAs, and property management companies across Western Washington. Commercial case studies with real results.',
}

// ---------------------------------------------------------------------------
// SERVICES HUB (/services/)
// ---------------------------------------------------------------------------

export const servicesHubBlocks = [
  // ── Hero ──────────────────────────────────────────────────────────────────
  {
    blockType: 'hero',
    heading: 'Mole Control Services in Western Washington',
    subheading:
      'One company. One focus. Moles. We serve Seattle, Tacoma, Bellevue, Sammamish, Puyallup, Renton, and 86 other communities across six counties. Chemical-free. Nearly 5,000 yards reclaimed since 2017.',
    layout: 'left',
    heroHeight: '85vh',
    fallbackImage: 'hero-team-field',
    cta: {
      text: 'CALL (253) 750-0211',
      url: 'tel:+12537500211',
      style: 'primary',
    },
    trustStrip: ['5-Star Rated', 'Nearly 5,000 Yards Reclaimed', 'Since 2017', 'Veteran-Owned', 'Safe for Pets & Kids'],
  },

  // ── GEO Definition ────────────────────────────────────────────────────────
  {
    blockType: 'geoDefinition',
    content:
      'Got Moles is a veteran-owned, chemical-free mole control company serving Western Washington since 2017. Three service programs: the Total Mole Control Program ($100/month year-round protection), One-Time Mole Removal ($450 flat rate for active infestations), and Commercial Mole Control (custom-quoted annual contracts). Nearly 5,000 residential and commercial properties served across King, Pierce, Snohomish, Thurston, Kitsap, and Lewis Counties. 219+ five-star Google reviews. Last updated May 2026.',
  },

  // ── Service Comparison ────────────────────────────────────────────────────
  {
    blockType: 'serviceComparison',
    heading: 'Which Mole Control Service Is Right for You?',
    background: 'grass-alt',
    services: [
      {
        name: 'Total Mole Control Program',
        link: '/services/total-mole-control-program/',
        bestFor: 'Recurring mole activity. Homeowners who want ongoing protection and never want to deal with moles again.',
        howItWorks: 'Year-round monitoring with regular visits. Immediate response to new activity between scheduled checks.',
        pricing: '$100/month',
        guarantee: 'New activity between visits? We come back at no extra charge.',
        duration: '12-month initial commitment, then month-to-month',
        reporting: 'Written report after every visit',
      },
      {
        name: 'One-Time Mole Removal',
        link: '/services/one-time-mole-removal/',
        bestFor: 'An active mole problem you need solved now. One-time fix without an ongoing commitment.',
        howItWorks: 'Focused 4-5 week trapping campaign. Inspection, equipment setup, weekly service visits, full removal.',
        pricing: '$450 flat rate',
        guarantee: 'No moles caught? You only pay the $150 setup fee.',
        duration: 'One month',
        reporting: 'Summary on completion',
      },
      {
        name: 'Commercial Mole Control',
        link: '/services/commercial-mole-control/',
        bestFor: 'Property managers, HOAs, sports facilities, schools, landscaping contractors, and hospitality venues.',
        howItWorks: 'Annual contract with a custom visit schedule based on property size and mole activity.',
        pricing: 'Custom quote after site inspection',
        guarantee: 'Guaranteed response times written into your contract',
        duration: 'Annual',
        reporting: 'Scheduled reports per contract terms',
      },
    ],
    footnote: 'Not sure which one fits? Call us at (253) 750-0211. We\'ll recommend the right program for your property.',
  },

  // ── Residential Overview (ImageText) ──────────────────────────────────────
  {
    blockType: 'imageText',
    heading: 'Professional Mole Control for Washington Homeowners',
    showDivider: false,
    image: '/images/spencer-probe.webp',
    fallbackImage: 'spencer-probe',
    imageAlt: 'Spencer Hill using a mole probe to locate active tunnels on a residential lawn',
    imagePosition: 'right',
    background: 'grass',
    content: paragraphs(
      'Got Moles does one thing: remove moles. No general pest treatment, no chemicals, no guesswork. Every job starts with a physical inspection and evidence-based analysis of mole activity on your property.',
      'Two residential programs. The [Total Mole Control Program](/services/total-mole-control-program/) keeps your yard protected year-round at $100/month. [One-Time Mole Removal](/services/one-time-mole-removal/) is a focused trapping campaign for an active problem — $450 flat rate with a guarantee.',
      'From Sammamish and Bellevue to Tacoma and Puyallup, we\'ve cleared nearly 5,000 residential properties since 2017. See [how the process works](/how-it-works/) from first call to mole-free yard.',
    ),
  },

  // ── Commercial Overview (ImageText) ───────────────────────────────────────
  {
    blockType: 'imageText',
    heading: 'Commercial Mole Control',
    showDivider: false,
    image: '/images/commercial-grounds.webp',
    fallbackImage: 'commercial-grounds',
    imageAlt: 'Commercial property grounds protected by Got Moles mole control program',
    imagePosition: 'left',
    background: 'grass-alt',
    content: paragraphs(
      'Got Moles works with property managers, HOAs, sports clubs, schools, landscaping contractors, and hospitality venues across Western Washington. Every commercial job runs on an annual contract, custom-quoted after a site inspection.',
      'No chemicals means no safety concerns for schools, public parks, or sports fields. You get documentation and reporting after every visit — ready for your stakeholders. [See full commercial details](/services/commercial-mole-control/).',
    ),
  },

  // ── Testimonial ───────────────────────────────────────────────────────────
  {
    blockType: 'testimonial',
    heading: 'What Our Clients Say',
    showDivider: false,
    background: 'grass',
    quotes: [
      {
        text: "We tried two other companies before finding Got Moles. Spencer came out, assessed the damage, and had traps set the same day. Within three weeks the moles were gone. Wish we had called them first.",
        name: 'Jennifer M.',
        city: 'Sammamish',
        rating: 5,
      },
      {
        text: 'Professional, reliable, and they actually solved the problem. The monthly reports are a nice touch.',
        name: 'David R.',
        city: 'Bellevue',
        rating: 5,
      },
      {
        text: 'Our HOA tried a general pest company for two years. Got Moles handled it in one season. We signed the annual contract immediately.',
        name: 'Karen T.',
        city: 'Issaquah',
        rating: 5,
      },
    ],
    reviewLink: '/reviews/',
  },

  // ── FAQ ────────────────────────────────────────────────────────────────────
  {
    blockType: 'faq',
    heading: 'Common Questions About Mole Control Services',
    showDivider: false,
    background: 'grass-alt',
    generateSchema: true,
    items: [
      {
        question: 'How much does mole control cost?',
        answer:
          'Two residential options. The Total Mole Control Program is $100/month for year-round protection (12-month initial commitment). One-Time Mole Removal is a $450 flat rate for an active problem — that includes a $150 setup fee, which is all you pay if no moles are caught. Commercial properties are custom-quoted after a site inspection. Call (253) 750-0211 for a free assessment.',
      },
      {
        question: 'What is the difference between the Total Mole Control Program and One-Time Mole Removal?',
        answer:
          'The Total Mole Control Program is year-round. Regular visits, immediate response to new mole activity between checks, and a written report every time. One-Time Mole Removal is a focused 4-5 week trapping campaign to clear an active problem. If moles keep showing up, the TMCP stops the cycle.',
      },
      {
        question: 'Is mole control safe for pets and children?',
        answer:
          'Completely safe. Got Moles uses chemical-free trapping methods only. No poisons, no fumigants, no surface chemicals. All equipment is placed inside mole tunnels underground. Nearly 5,000 families with children and pets trust Got Moles to protect their yards.',
      },
      {
        question: 'How long does it take to get rid of moles?',
        answer:
          'Most yards are cleared within 4 to 5 weeks. Spencer and the team assess activity on the first visit, set traps in active tunnels, and return weekly to check and adjust. Bigger properties or heavier infestations can take longer.',
      },
      {
        question: 'Do you serve my area?',
        answer:
          'Got Moles serves six counties across Western Washington: King, Pierce, Snohomish, Thurston, Kitsap, and Lewis. That covers 92+ communities including Seattle, Tacoma, Bellevue, Sammamish, Puyallup, Renton, Auburn, Kirkland, and more. Check our service areas page for the full list.',
      },
      {
        question: 'What if the moles come back after treatment?',
        answer:
          'Moles are territorial. When one is removed, a new mole can move into the vacant territory over time. That\'s normal — not a sign the treatment failed. It\'s exactly why the Total Mole Control Program exists. TMCP clients get immediate response to new activity at no extra charge.',
      },
    ],
  },

  // ── Service Area Snippet ──────────────────────────────────────────────────
  {
    blockType: 'serviceArea',
    heading: 'Serving Six Counties Across Western Washington',
    showDivider: false,
    background: 'grass',
    countyText: 'King, Pierce, Snohomish, Thurston, Kitsap, and Lewis Counties',
    cities: [
      { name: 'Seattle', url: '/mole-control-seattle/' },
      { name: 'Tacoma', url: '/mole-control-tacoma/' },
      { name: 'Bellevue', url: '/mole-control-bellevue/' },
      { name: 'Sammamish', url: '/mole-control-sammamish/' },
      { name: 'Puyallup', url: '/mole-control-puyallup/' },
      { name: 'Renton', url: '/mole-control-renton/' },
      { name: 'Auburn', url: '/mole-control-auburn/' },
      { name: 'Kirkland', url: '/mole-control-kirkland/' },
    ],
  },

  // ── Final CTA ─────────────────────────────────────────────────────────────
  {
    blockType: 'cta',
    heading: 'Ready to Take Your Yard Back?',
    body: 'Call Got Moles for a free inspection. We\'ll assess your property, recommend the right service, and start clearing moles within days.',
    buttonText: 'CALL (253) 750-0211',
    buttonUrl: 'tel:+12537500211',
    buttonStyle: 'primary',
    subtext: 'Or call (253) 750-0211 for a free quote.',
    showForm: true,
    background: 'gradient',
  },
]

export const servicesHubMeta = {
  title: 'Mole Control Services | Got Moles | Western Washington',
  description:
    "Compare Got Moles' mole control services: Total Mole Control Program ($100/mo), One-Time Removal ($450), and Commercial contracts. Chemical-free. 219+ five-star reviews. Serving 6 WA counties.",
  canonicalPath: '/services/',
}
