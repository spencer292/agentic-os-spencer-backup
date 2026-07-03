import React from 'react'
import { HeroBlock } from './HeroBlock'
import { RichContentBlock } from './RichContentBlock'
import { CTABlock } from './CTABlock'
import { FAQBlock } from './FAQBlock'
import { FeatureGridBlock } from './FeatureGridBlock'
import { ImageTextBlock } from './ImageTextBlock'
import { TrustBarBlock } from './TrustBarBlock'
import { TestimonialBlock } from './TestimonialBlock'
import { StatsBlock } from './StatsBlock'
import { GEODefinitionBlock } from './GEODefinitionBlock'
import { PainPointsBlock } from './PainPointsBlock'
import { StepsProcessBlock } from './StepsProcessBlock'
import { ServiceAreaBlock } from './ServiceAreaBlock'
import { TeamCardsBlock } from './TeamCardsBlock'
import { ServiceComparisonBlock } from './ServiceComparisonBlock'
import { TableBlock } from './TableBlock'
import { TLDRBlock } from './TLDRBlock'
import { BeforeAfterBlock } from './BeforeAfterBlock'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blockComponents: Record<string, React.FC<{ block: any }>> = {
  hero: HeroBlock,
  richContent: RichContentBlock,
  cta: CTABlock,
  faq: FAQBlock,
  featureGrid: FeatureGridBlock,
  imageText: ImageTextBlock,
  trustBar: TrustBarBlock,
  testimonial: TestimonialBlock,
  stats: StatsBlock,
  geoDefinition: GEODefinitionBlock,
  painPoints: PainPointsBlock,
  stepsProcess: StepsProcessBlock,
  serviceArea: ServiceAreaBlock,
  teamCards: TeamCardsBlock,
  serviceComparison: ServiceComparisonBlock,
  table: TableBlock,
  tldr: TLDRBlock,
  beforeAfter: BeforeAfterBlock,
}

interface RenderBlocksProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blocks: any[]
}

export function RenderBlocks({ blocks }: RenderBlocksProps) {
  if (!blocks || blocks.length === 0) return null

  return (
    <>
      {blocks.map((block, i) => {
        const Component = blockComponents[block.blockType]
        if (!Component) {
          if (process.env.NODE_ENV === 'development') {
            return (
              <div key={block.id || i} className="bg-red-50 p-4 text-red-800 text-sm border border-red-200">
                Unknown block type: <code className="font-mono">{block.blockType}</code>
              </div>
            )
          }
          return null
        }
        return <Component key={block.id || i} block={block} />
      })}
    </>
  )
}
