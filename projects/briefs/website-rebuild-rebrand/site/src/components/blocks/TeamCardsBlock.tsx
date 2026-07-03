import Image from 'next/image'
import { Section } from '../Section'

interface TeamMember {
  name: string
  role: string
  bio: string
  photoKey: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TeamCardsBlock({ block }: { block: any }) {
  // Dark-first only. `cream` removed from block options per design-system.md
  // Page Structure Checklist rule 3 ("no cream backgrounds"). Text + card
  // styling is always on grass — matches test pages bg-white/5 card pattern.
  const bg = (block.background as 'grass' | 'grass-alt') || 'grass-alt'
  const members: TeamMember[] = block.members || []

  return (
    <Section background={bg}>
      {block.heading && (
        <div className="text-center mb-12">
          <h2
            className="font-heading text-h2 uppercase tracking-tight text-cream-200 mb-4"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            {block.heading}
          </h2>
          {block.subheading && (
            <p className="font-body text-body-lg text-cream-200/80 max-w-2xl mx-auto">
              {block.subheading}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {members.map((member, i) => {
          const imageUrl = `/images/${member.photoKey}.webp`
          const imageAlt = `${member.name} — ${member.role} at Got Moles`

          return (
            <article
              key={i}
              className="bg-white/5 rounded-2xl overflow-hidden hover:bg-white/10 transition-colors"
            >
              <div className="relative aspect-[3/4]">
                <Image
                  src={imageUrl}
                  alt={imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-6 lg:p-8">
                <h3 className="font-heading font-bold text-h4 lg:text-2xl uppercase tracking-tight text-cream-200 mb-1">
                  {member.name}
                </h3>
                <p className="font-body font-semibold text-sm uppercase tracking-[0.1em] text-cream-200/60 mb-4">
                  {member.role}
                </p>
                <p className="font-body text-body-lg leading-relaxed text-cream-200/80">
                  {member.bio}
                </p>
              </div>
            </article>
          )
        })}
      </div>
    </Section>
  )
}
