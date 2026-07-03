/**
 * Build og-default.webp — branded 1200×630 social card.
 *
 * Composites the primary logo (cream variant) onto a grass-colored canvas.
 * Follows brand guidelines:
 *   - Grass background (#184241, primary color, 60%+ of design)
 *   - Cream logo on dark background (per color usage rules)
 *   - No box around logo, no altered logo colors, no locked-up text
 *   - Ample clear space (logo sits at ~50% width, centered)
 *
 * Run from site/ directory:
 *   node src/scripts/build-og-default.mjs
 */
import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'

const GRASS = '#184241'
const LOGO_SVG = path.resolve(
  'C:/Claude/agent-os/clients/got-moles/brand_context/rebrand/FILES/SVG/PRIMARY LOGO FILES-02.svg',
)
const OUTPUT = path.resolve('public/images/og-default.webp')

const CANVAS_W = 1200
const CANVAS_H = 630

// Logo target: ~55% canvas width, preserving native aspect ratio (918.95 × 220.63 ≈ 4.17:1)
const LOGO_W = 660
const LOGO_H = Math.round((LOGO_W * 220.63) / 918.95)

async function main() {
  const logoSvg = await fs.readFile(LOGO_SVG)

  // Render logo SVG to PNG buffer at target size
  const logoBuffer = await sharp(logoSvg, { density: 300 })
    .resize(LOGO_W, LOGO_H, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  // Build grass canvas and composite logo centered
  await sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 4,
      background: GRASS,
    },
  })
    .composite([
      {
        input: logoBuffer,
        top: Math.round((CANVAS_H - LOGO_H) / 2),
        left: Math.round((CANVAS_W - LOGO_W) / 2),
      },
    ])
    .webp({ quality: 90 })
    .toFile(OUTPUT)

  const stat = await fs.stat(OUTPUT)
  console.log(`Wrote ${OUTPUT}`)
  console.log(`  ${CANVAS_W}×${CANVAS_H} WebP, ${(stat.size / 1024).toFixed(1)} KB`)
  console.log(`  Logo: ${LOGO_W}×${LOGO_H} cream on grass #184241`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
