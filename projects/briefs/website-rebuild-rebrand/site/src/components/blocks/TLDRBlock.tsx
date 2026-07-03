export function TLDRBlock({ block }: { block: any }) {
  if (!block.content) return null

  return (
    <div
      id="blog-definition-block"
      role="note"
      aria-label="Summary"
      className="py-6 lg:py-8"
      style={{ background: 'linear-gradient(to bottom, #184241 65%, #153635 100%)' }}
    >
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-[65ch] mx-auto">
          <p className="font-body text-body-lg text-cream-200/90 leading-relaxed">
            {block.content}
          </p>
        </div>
      </div>
    </div>
  )
}
