import { Section } from '../Section'

// Payload richText returns a Lexical JSON structure. This renderer handles the
// most common node types: paragraph, heading, list. For full richText rendering
// consider installing @payloadcms/richtext-lexical/react.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderRichText(content: any): React.ReactNode {
  if (!content || !content.root) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderNode(node: any, key: number, parentListType?: string): React.ReactNode {
    if (!node) return null

    switch (node.type) {
      case 'root':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return node.children?.map((child: any, i: number) => renderNode(child, i))

      case 'paragraph':
        return (
          <p key={key} className="font-body text-body-lg leading-relaxed mb-4 last:mb-0">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {node.children?.map((child: any, i: number) => renderNode(child, i))}
          </p>
        )

      case 'heading': {
        const Tag = (node.tag || 'h2') as React.ElementType
        const headingClass = node.tag === 'h2'
          ? 'font-heading text-h2 uppercase tracking-tight mb-4 mt-8 first:mt-0'
          : node.tag === 'h3'
            ? 'font-body font-semibold text-h3 mb-3 mt-6 first:mt-0'
            : 'font-body font-semibold text-h4 mb-2 mt-4 first:mt-0'
        return (
          <Tag key={key} className={headingClass} style={node.tag === 'h2' ? { textWrap: 'balance' } as React.CSSProperties : undefined}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {node.children?.map((child: any, i: number) => renderNode(child, i))}
          </Tag>
        )
      }

      case 'list':
        if (node.listType === 'bullet') {
          return (
            <ul key={key} className="font-body text-body-lg list-none space-y-2 mb-4 pl-0">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {node.children?.map((child: any, i: number) => renderNode(child, i, 'bullet'))}
            </ul>
          )
        }
        return (
          <ol key={key} className="font-body text-body-lg list-none space-y-2 mb-4 pl-0">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {node.children?.map((child: any, i: number) => renderNode(child, i, 'number'))}
          </ol>
        )

      case 'listitem':
        if (parentListType === 'number') {
          return (
            <li key={key} className="flex items-start gap-3">
              <span className="font-heading font-bold text-gold-500 mt-0.5 flex-shrink-0 min-w-[1.5rem]">{key + 1}.</span>
              <span>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {node.children?.map((child: any, i: number) => renderNode(child, i))}
              </span>
            </li>
          )
        }
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
          <a
            key={key}
            href={node.fields?.url || '#'}
            className="text-gold-500 hover:text-gold-400 underline"
          >
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
export function RichContentBlock({ block }: { block: any }) {
  const bg = (block.background as 'grass' | 'cream' | 'grass-alt') || 'grass'
  const isLight = bg === 'cream'

  return (
    <Section background={bg}>
      <div className="max-w-3xl mx-auto">
        {block.heading && (
          <div className="mb-8">
            <h2
              className="font-heading text-h2 uppercase tracking-tight mb-4"
              style={{ textWrap: 'balance' } as React.CSSProperties}
            >
              {block.heading}
            </h2>
          </div>
        )}

        <div className={`prose-none ${isLight ? 'text-neutral-700' : 'text-cream-200/90'}`}>
          {renderRichText(block.content)}
        </div>
      </div>
    </Section>
  )
}
