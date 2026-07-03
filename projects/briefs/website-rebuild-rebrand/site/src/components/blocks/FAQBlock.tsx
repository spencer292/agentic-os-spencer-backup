import { Section } from '../Section'
import Link from 'next/link'
import { Fragment } from 'react'

// Parse markdown links `[text](url)` inside FAQ answers and render them as
// real <Link> elements. Per the internal-linking-recovery strategy §5.4 +
// §7 (in-content contextual links carry highest SEO weight).
//
// Supports inline links only — no other markdown formatting (intentional;
// keeps the FAQ data simple and the rendering predictable).
const MD_LINK = /\[([^\]]+)\]\(([^)]+)\)/g

function renderAnswer(answer: string) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  // Reset regex state between calls
  MD_LINK.lastIndex = 0
  while ((match = MD_LINK.exec(answer)) !== null) {
    if (match.index > lastIndex) {
      parts.push(answer.slice(lastIndex, match.index))
    }
    const [, text, url] = match
    parts.push(
      <Link
        key={`${match.index}-${url}`}
        href={url}
        className="text-gold-500 hover:text-gold-400 underline underline-offset-2 decoration-gold-500/40 hover:decoration-gold-500"
      >
        {text}
      </Link>,
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < answer.length) {
    parts.push(answer.slice(lastIndex))
  }
  return parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)
}

// For the FAQPage JSON-LD schema, Answer.text must be plain text (Google
// guideline). Strip markdown link syntax to plain anchor text + the URL stays
// in a separate machine-readable field if we add one later.
function stripMarkdown(answer: string): string {
  return answer.replace(MD_LINK, '$1')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FAQBlock({ block }: { block: any }) {
  const bg = (block.background as 'grass' | 'cream' | 'grass-alt') || 'grass'
  const isLight = bg === 'cream'
  const items: { question: string; answer: string }[] = block.items || []

  return (
    <Section background={bg}>
      {block.heading && (
        <div className="max-w-3xl mx-auto mb-10">
          <h2
            className="font-heading text-h2 uppercase tracking-tight mb-4 text-center"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            {block.heading}
          </h2>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {items.map((item, i) => (
          <details
            key={i}
            className={`group border-b ${isLight ? 'border-neutral-200' : 'border-cream-200/10'}`}
          >
            <summary
              className={`cursor-pointer py-5 flex items-center justify-between gap-4 ${isLight ? 'text-neutral-800' : 'text-cream-200'}`}
            >
              <span className="font-body font-semibold text-body-lg leading-snug">
                {item.question}
              </span>
              <span
                className="flex-shrink-0 transition-transform duration-200 group-open:rotate-180"
                aria-hidden="true"
              >
                <svg className="w-5 h-5 text-gold-500" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 8l5 5 5-5" />
                </svg>
              </span>
            </summary>
            <div className={`pb-5 pr-10 font-body text-body-lg leading-relaxed ${isLight ? 'text-neutral-600' : 'text-cream-200/80'}`}>
              {renderAnswer(item.answer)}
            </div>
          </details>
        ))}
      </div>

      {block.moreLink?.text && block.moreLink?.url && (
        <div className="text-center mt-8">
          <a
            href={block.moreLink.url}
            className="inline-flex items-center gap-1.5 font-body text-sm text-gold-500 hover:text-gold-400"
          >
            {block.moreLink.text}
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M8 3l5 5-5 5" />
            </svg>
          </a>
        </div>
      )}

      {/* FAQPage JSON-LD schema. Strip markdown from answers so Answer.text
          is plain prose per Google's FAQPage guidelines. */}
      {block.generateSchema !== false && items.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: items.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: stripMarkdown(item.answer),
                },
              })),
            }),
          }}
        />
      )}
    </Section>
  )
}
