# Captions

Synced captions, subtitles, and per-word effects for video compositions.

## Style Detection

When the user doesn't specify, analyse four dimensions:
- Visual feel, colour palette, font mood, animation character

## Tone-Based Styling

| Tone | Typography | Animation | Size |
|------|------------|-----------|------|
| Hype/launch | Heavy condensed | Scale-pop | 72-96px |
| Corporate | Clean sans-serif | Fade + slide | 56-72px |
| Tutorial | Monospace | Typewriter | 48-64px |
| Storytelling | Serif | Slow fade | 44-56px |
| Social | Rounded sans | Bounce | 56-80px |

## Per-Word Emphasis

Identify candidates for special treatment:
- Brand/product names -> distinct colour, slightly larger
- ALL CAPS words -> weight emphasis
- Numbers/statistics -> counter animation or colour accent
- Emotional keywords -> bounce or scale animation
- CTAs -> accent colour, bold weight

## Text Overflow Prevention

Use `window.__hyperframes.fitTextFontSize(text, { maxWidth, fontFamily, fontWeight })`
to dynamically scale text to fit containers.

## Kill Commands

Every caption group needs a deterministic kill at its end timestamp:
```javascript
tl.set(captionEl, { opacity: 0, visibility: "hidden" }, endTime);
```

Self-lint: verify no captions remain visible beyond their intended duration.
