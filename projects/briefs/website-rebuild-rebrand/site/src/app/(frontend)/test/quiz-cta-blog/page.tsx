import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero } from '@/components/PageHero'
import { Section } from '@/components/Section'
import { CTABlock } from '@/components/CTABlock'
import { QuizCTA } from '@/components/QuizCTA'

export const metadata: Metadata = {
  title: 'Test — Quiz CTA Integrated into Blog Template (with FAQ)',
  robots: 'noindex, nofollow',
}

// Mock blog post data — mimics CMS shape used by BlogPostContent.
const MOCK = {
  title: 'How to Choose a Mole Control Company: 7 Things to Ask',
  slug: 'how-to-choose-a-mole-control-company',
  cluster: 'Mole Control',
  authorName: 'Spencer Hill',
  bluf: "When hiring a mole control company in Washington, ask about their specialization, pricing model, guarantee terms, visit frequency, written reports, and how long they have been in business. A mole specialist with transparent pricing and a results guarantee will outperform a general pest company.",
  paragraphs: [
    "You've got moles. You want them gone. You search online and find half a dozen companies that say they can help.",
    "How do you pick the right one? Because the wrong choice means spending money, waiting weeks, and ending up right back where you started — with moles still in your yard and less patience than before.",
    "Here are the seven questions that separate a good mole control company from a waste of your time.",
    "A company that handles ants, spiders, termites, rats, AND moles is spreading its attention across dozens of pest types. A mole-only company has spent years perfecting one thing.",
    "There are two common pricing models, and they produce very different final bills: per-mole pricing (setup fee plus a fee per mole caught) and flat-rate pricing (fixed price regardless of how many moles).",
  ],
  faqs: [
    {
      question: "What's the difference between a mole specialist and a general pest company?",
      answer: 'A mole specialist does one thing — mole control. The specialist will almost always produce better results, faster, with fewer callbacks.',
    },
    {
      question: 'Should I get multiple quotes?',
      answer: "Getting two or three quotes is reasonable. Compare what's included, not just the headline price.",
    },
    {
      question: 'How do I know if a company is any good?',
      answer: 'Google reviews are the best signal. Look for volume, consistency, and specificity.',
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// SIMULATED BLOG POST FLOW — mimics BlogPostContent.tsx with QuizCTA inserted
// mid-flow and the downstream alternation cascade applied.
//
// All 35 current blog posts have FAQs (verified 2026-05-05), so this flow
// covers the real-world case. No no-FAQ branch needed.
//
// Section background sequence (with FAQ + QuizCTA):
//   PageHero (image)
//   grass        — body content
//   grass-alt    — QuizCTA (mid-flow)
//   grass        — FAQ          (flipped from grass-alt)
//   grass-alt    — Related      (flipped from grass)
//   grass        — Author       (flipped from grass-alt)
//   gradient     — final CTABlock
//
// Page Structure Checklist:
//   [3] No cream backgrounds        ✓
//   [4] gradient only on last block ✓
//   [7] No adjacent same-bg         ✓
// ─────────────────────────────────────────────────────────────────────────────

export default function TestQuizCTABlogPage() {
  return (
    <>
      <PageHero
        heading={MOCK.title}
        image="/images/blog-choose-company.webp"
        imageAlt={MOCK.title}
        height="70vh"
      />

      {/* BODY — grass */}
      <Section background="grass">
        <div className="max-w-[720px] mx-auto">
          <div className="mb-10">
            <p className="font-body text-body-lg text-cream-200/80 leading-relaxed max-w-[55ch]">
              {MOCK.bluf}
            </p>
          </div>
          <div className="max-w-none">
            <h2 className="font-heading text-h2 uppercase tracking-tight text-cream-200 mt-10 mb-4">
              Why This Matters
            </h2>
            {MOCK.paragraphs.slice(0, 3).map((p, i) => (
              <p
                key={i}
                className="font-body text-body-lg text-cream-200/90 leading-relaxed mb-4"
              >
                {p}
              </p>
            ))}
            <h2 className="font-heading text-h2 uppercase tracking-tight text-cream-200 mt-10 mb-4">
              1. Do They Specialize in Moles?
            </h2>
            {MOCK.paragraphs.slice(3).map((p, i) => (
              <p
                key={i}
                className="font-body text-body-lg text-cream-200/90 leading-relaxed mb-4"
              >
                {p}
              </p>
            ))}
          </div>
        </div>
      </Section>

      {/* QUIZ CTA mid-flow — grass-alt */}
      <QuizCTA
        cluster={MOCK.cluster}
        slug={MOCK.slug}
        variant="block"
        background="grass-alt"
      />

      {/* FAQ — grass (flipped from grass-alt) */}
      <Section background="grass">
        <div className="max-w-[720px] mx-auto">
          <h2 className="font-heading text-h2 uppercase tracking-tight mb-8 text-cream-200">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {MOCK.faqs.map((faq) => (
              <details
                key={faq.question}
                className="group border-b border-cream-200/10 pb-3"
              >
                <summary className="cursor-pointer font-body font-semibold text-body-lg text-cream-200 py-3 flex justify-between items-center">
                  {faq.question}
                  <svg
                    className="w-5 h-5 text-gold-500 shrink-0 ml-4 transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="blog-faq-answer font-body text-body-lg text-cream-200/80 leading-relaxed mt-2 pr-8">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* RELATED SERVICES — grass-alt (flipped from grass) */}
      <Section background="grass-alt">
        <div className="max-w-[720px] mx-auto">
          <h2 className="font-heading text-h2 uppercase tracking-tight mb-8">
            Related Services &amp; Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-body font-semibold text-cream-200 mb-3">Our Services</h3>
              <ul className="space-y-2 font-body text-body-lg text-cream-200/80">
                <li>
                  <Link
                    href="/services/total-mole-control-program"
                    className="text-gold-500 hover:text-gold-400 no-underline"
                  >
                    Total Mole Control Program
                  </Link>{' '}
                  — $100/month year-round protection
                </li>
                <li>
                  <Link
                    href="/services/one-time-mole-removal"
                    className="text-gold-500 hover:text-gold-400 no-underline"
                  >
                    One-Time Mole Removal
                  </Link>{' '}
                  — $450 flat rate with guarantee
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-body font-semibold text-cream-200 mb-3">Learn More</h3>
              <ul className="space-y-2 font-body text-body-lg text-cream-200/80">
                <li>
                  <Link href="/how-it-works" className="text-gold-500 hover:text-gold-400 no-underline">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-gold-500 hover:text-gold-400 no-underline">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* AUTHOR BIO — grass (flipped from grass-alt) */}
      <Section background="grass">
        <div className="max-w-[720px] mx-auto flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-gold-500/20 flex items-center justify-center shrink-0">
            <span className="font-heading font-bold text-xl text-gold-500">
              {MOCK.authorName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-body font-semibold text-cream-200">{MOCK.authorName}</p>
            <p className="font-body text-body-lg text-cream-200/75 mt-1">
              Spencer Hill is a US Army veteran and founder of Got Moles, a mole
              control specialist serving Western Washington. He has helped over
              5,000 homeowners reclaim their yards using chemical-free,
              professional trapping methods.
            </p>
          </div>
        </div>
      </Section>

      {/* FINAL CTA — gradient. Must be the LAST block (design-system Rule 4).
          Inline QuizCTA verification lives on /test/quiz-cta in isolation;
          its final integration goes inside this CTABlock via a secondaryLine
          prop (added in a separate change). */}
      <CTABlock
        heading="Ready to Reclaim Your Yard?"
        body="Call (253) 750-0211 — we serve all of Western Washington."
        showForm={true}
        subtext="Free. No obligation."
      />
    </>
  )
}
