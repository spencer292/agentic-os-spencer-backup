// GEO Definition Block
// AI-extractable definition placed in the first 30% of page content.
// Outputs Speakable schema for voice search / AI citation eligibility.
// Renders without section padding so it sits flush within the page flow.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function GEODefinitionBlock({ block }: { block: any }) {
  if (!block.content) return null

  return (
    <div
      id="geo-definition"
      className="py-6 lg:py-8"
      style={{ background: 'linear-gradient(to bottom, #184241 65%, #153635 100%)' }}
    >
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <p className="font-body text-body-lg text-cream-200/80 leading-relaxed max-w-[65ch] mx-auto text-center">
          {block.content}
        </p>
      </div>

      {/* Speakable schema for AI / voice search citation */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPageElement',
            cssSelector: '#geo-definition',
            speakable: {
              '@type': 'SpeakableSpecification',
              cssSelector: ['#geo-definition'],
            },
          }),
        }}
      />
    </div>
  )
}
