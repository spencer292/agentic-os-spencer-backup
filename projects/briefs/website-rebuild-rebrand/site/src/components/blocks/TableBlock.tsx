import { Section } from '../Section'

export function TableBlock({ block }: { block: any }) {
  const rows: { cells: { content: string }[] }[] = block.rows || []
  if (rows.length === 0) return null

  const bg = (block.background as 'grass' | 'cream' | 'grass-alt') || 'grass'
  const isLight = bg === 'cream'
  const hasHeader = block.hasHeader ?? true
  const headerRow = hasHeader ? rows[0] : null
  const bodyRows = hasHeader ? rows.slice(1) : rows

  return (
    <Section background={bg}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {block.caption && (
            <caption className={`font-body text-small text-center mb-4 caption-bottom ${isLight ? 'text-neutral-500' : 'text-cream-200/60'}`}>
              {block.caption}
            </caption>
          )}
          {headerRow && (
            <thead>
              <tr>
                {headerRow.cells.map((cell: { content: string }, i: number) => (
                  <th key={i} className={`p-3 font-heading font-bold text-sm uppercase tracking-tight border-b ${isLight ? 'text-gold-600 border-neutral-300' : 'text-gold-500 border-cream-200/20'}`}>
                    {cell.content}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {bodyRows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? (isLight ? 'bg-neutral-50' : 'bg-white/5') : (isLight ? 'bg-white' : 'bg-white/[0.02]')}>
                {row.cells.map((cell: { content: string }, ci: number) => (
                  <td key={ci} className={`p-3 font-body text-body-lg border-b ${isLight ? 'text-neutral-700 border-neutral-200' : 'text-cream-200/90 border-cream-200/10'}`}>
                    {cell.content}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}
