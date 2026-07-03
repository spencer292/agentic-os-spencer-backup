import Image from 'next/image'
import { Section } from '../Section'

// Inline richText renderer for image+text block
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderRichText(content: any, isLight: boolean): React.ReactNode {
  if (!content || !content.root) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderNode(node: any, key: number): React.ReactNode {
    if (!node) return null
    switch (node.type) {
      case 'root':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return node.children?.map((child: any, i: number) => renderNode(child, i))
      case 'paragraph':
        return (
          <p key={key} className={`font-body text-body-lg leading-relaxed mb-4 last:mb-0 ${isLight ? 'text-neutral-700' : 'text-cream-200/90'}`}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {node.children?.map((child: any, i: number) => renderNode(child, i))}
          </p>
        )
      case 'heading': {
        const Tag = (node.tag || 'h3') as React.ElementType
        return (
          <Tag key={key} className={`font-body font-semibold text-h3 mb-3 mt-6 first:mt-0 ${isLight ? 'text-neutral-800' : 'text-cream-200'}`}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {node.children?.map((child: any, i: number) => renderNode(child, i))}
          </Tag>
        )
      }
      case 'list':
        return (
          <ul key={key} className={`font-body text-body-lg list-none space-y-2 mb-4 ${isLight ? 'text-neutral-700' : 'text-cream-200/90'}`}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {node.children?.map((child: any, i: number) => renderNode(child, i))}
          </ul>
        )
      case 'listitem':
        return (
          <li key={key} className="flex items-start gap-2">
            <span className="text-gold-500 mt-1 flex-shrink-0">&#10003;</span>
            <span>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {node.children?.map((child: any, i: number) => renderNode(child, i))}
            </span>
          </li>
        )
      case 'text': {
        let text: React.ReactNode = node.text
        if (node.format & 1) text = <strong key={key}>{text}</strong>
        if (node.format & 2) text = <em key={key}>{text}</em>
        return text
      }
      case 'linebreak':
        return <br key={key} />
      case 'link':
        return (
          <a key={key} href={node.fields?.url || '#'} className="text-gold-500 hover:text-gold-400 underline">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {node.children?.map((child: any, i: number) => renderNode(child, i))}
          </a>
        )
      default:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return node.children?.map((child: any, i: number) => renderNode(child, i)) || null
    }
  }

  return renderNode(content.root, 0)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ImageTextBlock({ block }: { block: any }) {
  const bg = (block.background as 'grass' | 'grass-alt') || 'grass-alt'
  const isLight = false
  const imageRight = block.imagePosition !== 'left'

  const imageUrl =
    typeof block.image === 'object' && block.image !== null
      ? block.image.url
      : typeof block.image === 'string'
        ? block.image
        : block.fallbackImage
          ? `/images/${block.fallbackImage}${block.fallbackImage.includes('.') ? '' : '.webp'}`
          : null

  const imageAlt = block.imageAlt || (typeof block.image === 'object' && block.image?.alt) || ''

  return (
    <Section background={bg}>
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${!imageRight ? 'lg:[direction:rtl]' : ''}`}>
        {/* Text column */}
        <div className={!imageRight ? 'lg:[direction:ltr]' : ''}>
          {block.heading && (
            <h2
              className={`font-heading text-h2 uppercase tracking-tight mb-4 ${isLight ? 'text-neutral-800' : 'text-cream-200'}`}
              style={{ textWrap: 'balance' } as React.CSSProperties}
            >
              {block.heading}
            </h2>
          )}
          <div>
            {renderRichText(block.content, isLight)}
          </div>
        </div>

        {/* Image column */}
        <div className={`relative aspect-[4/3] overflow-hidden ${!imageRight ? 'lg:[direction:ltr]' : ''}`}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className={`w-full h-full ${isLight ? 'bg-neutral-100' : 'bg-cream-200/10'}`} />
          )}
        </div>
      </div>
    </Section>
  )
}
