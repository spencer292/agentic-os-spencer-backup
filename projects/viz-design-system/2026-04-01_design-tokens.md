# Design Tokens — Got Moles

Generated 2026-04-01. These tokens implement the design system defined in `brand_context/design-system.md`.

---

## CSS Custom Properties

```css
:root {
  /* ============================================
     TYPOGRAPHY
     ============================================ */

  /* Font families */
  --font-heading: 'Lexend', system-ui, -apple-system, sans-serif;
  --font-body: 'Zilla Slab', Georgia, 'Times New Roman', serif;

  /* Type scale (Perfect Fourth 1.333, fluid with clamp) */
  --text-display: clamp(2.25rem, 1.5rem + 3.75vw, 4.188rem);     /* 36px → 67px */
  --text-h1:      clamp(2rem, 1.5rem + 2.5vw, 3.125rem);          /* 32px → 50px */
  --text-h2:      clamp(1.625rem, 1.25rem + 1.875vw, 2.375rem);   /* 26px → 38px */
  --text-h3:      clamp(1.375rem, 1.15rem + 1.125vw, 1.75rem);    /* 22px → 28px */
  --text-h4:      clamp(1.125rem, 1rem + 0.625vw, 1.313rem);      /* 18px → 21px */
  --text-body-lg: 1.125rem;                                         /* 18px */
  --text-body:    1rem;                                              /* 16px */
  --text-small:   0.875rem;                                          /* 14px */
  --text-xs:      0.75rem;                                           /* 12px */

  /* Line heights */
  --leading-display: 1.1;
  --leading-h1: 1.15;
  --leading-h2: 1.2;
  --leading-h3: 1.25;
  --leading-h4: 1.3;
  --leading-body: 1.6;
  --leading-small: 1.5;
  --leading-xs: 1.4;

  /* Font weights */
  --weight-regular: 400;
  --weight-semibold: 600;
  --weight-bold: 700;

  /* Letter spacing */
  --tracking-tight: -0.02em;      /* Display, h1, h2 */
  --tracking-normal: 0;            /* Body, h3, h4 */
  --tracking-wide: 0.05em;         /* All-caps labels (trust bar) */
  --tracking-button: 0.1em;        /* Button text */

  /* Text width */
  --text-max-width: 65ch;

  /* ============================================
     COLORS — BRAND
     ============================================ */

  /* Grass (Primary) */
  --grass-50:  #E8F0F0;
  --grass-100: #C5D8D8;
  --grass-200: #9BBCBB;
  --grass-300: #6E9E9D;
  --grass-400: #3D7473;
  --grass-500: #1E524F;
  --grass-600: #184241;   /* Brand Grass */
  --grass-700: #133634;
  --grass-800: #0E2A28;
  --grass-900: #091E1D;
  --grass-950: #051312;

  /* Blue (Secondary) */
  --blue-50:  #EAEDF3;
  --blue-100: #C8CEE0;
  --blue-200: #9BA5C4;
  --blue-300: #6E7DA8;
  --blue-400: #3F4E7A;
  --blue-500: #1E2D52;
  --blue-600: #182034;   /* Brand Blue */
  --blue-700: #131A2A;
  --blue-800: #0E1420;
  --blue-900: #090E16;
  --blue-950: #05080D;

  /* Cream (Neutral/Light) */
  --cream-50:  #FFFBF2;
  --cream-100: #FFF7E8;
  --cream-200: #FFF1D9;   /* Brand Cream */
  --cream-300: #FFE8C2;
  --cream-400: #FFDEA8;
  --cream-500: #F5CE86;

  /* Gold (Accent/CTA) */
  --gold-50:  #FFF4E0;
  --gold-100: #FFE4B3;
  --gold-200: #FFD080;
  --gold-300: #FFBB4D;
  --gold-400: #F5A31A;
  --gold-500: #E68C04;   /* Brand Gold */
  --gold-600: #C47603;
  --gold-700: #A26103;
  --gold-800: #7A4902;
  --gold-900: #523201;

  /* Rust (Accent/Urgency) */
  --rust-50:  #F8EAEA;
  --rust-100: #E8C4C5;
  --rust-200: #D49597;
  --rust-300: #BF6568;
  --rust-400: #A74548;
  --rust-500: #8F2A2D;   /* Brand Rust */
  --rust-600: #782325;
  --rust-700: #611C1E;
  --rust-800: #4A1517;
  --rust-900: #330E10;

  /* ============================================
     COLORS — NEUTRALS (Grass-tinted)
     ============================================ */

  --neutral-50:  #F7F9F8;
  --neutral-100: #EEF1F0;
  --neutral-200: #DCE0DF;
  --neutral-300: #B8BFBE;
  --neutral-400: #8A9493;
  --neutral-500: #5E6A69;
  --neutral-600: #3D4A49;
  --neutral-700: #2A3433;
  --neutral-800: #1A2423;
  --neutral-900: #0D1413;

  /* ============================================
     COLORS — SEMANTIC
     ============================================ */

  --success-light: #E8F5E9;
  --success-mid:   #4A8B5C;
  --success-dark:  #1E5631;

  --warning-light: #FFF4E0;
  --warning-mid:   #D49B2A;
  --warning-dark:  #7A4902;

  --error-light: #F8EAEA;
  --error-mid:   #A74548;
  --error-dark:  #611C1E;

  --info-light: #EAEDF3;
  --info-mid:   #3F4E7A;
  --info-dark:  #182034;

  /* ============================================
     COLORS — SEMANTIC ASSIGNMENTS
     ============================================ */

  /* Dark surfaces (primary) */
  --color-bg-dark:        var(--grass-600);
  --color-bg-dark-alt:    var(--blue-600);
  --color-text-on-dark:   var(--cream-200);
  --color-text-muted-on-dark: rgba(255, 241, 217, 0.65);

  /* Light surfaces */
  --color-bg-light:       var(--cream-50);
  --color-bg-light-card:  #FFFFFF;
  --color-text-on-light:  var(--neutral-800);
  --color-text-muted-on-light: var(--neutral-400);

  /* Interactive */
  --color-cta:            var(--gold-500);
  --color-cta-hover:      var(--gold-600);
  --color-cta-active:     var(--gold-700);
  --color-cta-text:       var(--blue-600);

  /* Borders */
  --color-border-light:   var(--neutral-200);
  --color-border-dark:    rgba(255, 241, 217, 0.1);

  /* Gradients */
  --gradient-cta-section: linear-gradient(to bottom, #182034, #8F2A2D);

  /* ============================================
     SPACING (8pt grid)
     ============================================ */

  --space-1:  0.25rem;    /* 4px */
  --space-2:  0.5rem;     /* 8px */
  --space-3:  0.75rem;    /* 12px */
  --space-4:  1rem;       /* 16px */
  --space-6:  1.5rem;     /* 24px */
  --space-8:  2rem;       /* 32px */
  --space-12: 3rem;       /* 48px */
  --space-16: 4rem;       /* 64px */
  --space-24: 6rem;       /* 96px */
  --space-32: 8rem;       /* 128px */

  /* Section spacing (fluid) */
  --section-padding: clamp(3rem, 8vw, 6rem);          /* 48px → 96px */
  --section-padding-lg: clamp(4rem, 10vw, 8rem);      /* 64px → 128px */

  /* ============================================
     LAYOUT
     ============================================ */

  --container-max: 1280px;
  --container-padding: var(--space-4);      /* 16px mobile */
  --container-padding-md: var(--space-6);   /* 24px tablet */
  --container-padding-lg: var(--space-8);   /* 32px desktop */
  --grid-gap: var(--space-6);               /* 24px desktop */
  --grid-gap-mobile: var(--space-4);        /* 16px mobile */

  /* ============================================
     COMPONENTS
     ============================================ */

  /* Buttons */
  --btn-radius: 0;
  --btn-padding-x: 2.25rem;    /* 36px */
  --btn-padding-y: 1rem;       /* 16px */
  --btn-font-size: 0.875rem;   /* 14px */

  /* Divider accent */
  --divider-width: 48px;
  --divider-height: 3px;
  --divider-color: var(--gold-500);

  /* Sticky header */
  --header-height: 56px;

  /* Touch targets */
  --touch-target-min: 48px;

  /* Focus ring */
  --focus-ring-color: var(--gold-500);
  --focus-ring-offset: 2px;
  --focus-ring-width: 2px;

  /* ============================================
     MOTION
     ============================================ */

  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0.0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Tailwind Config Extension

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        grass: {
          50:  '#E8F0F0',
          100: '#C5D8D8',
          200: '#9BBCBB',
          300: '#6E9E9D',
          400: '#3D7473',
          500: '#1E524F',
          600: '#184241',   // Brand
          700: '#133634',
          800: '#0E2A28',
          900: '#091E1D',
          950: '#051312',
        },
        blue: {
          50:  '#EAEDF3',
          100: '#C8CEE0',
          200: '#9BA5C4',
          300: '#6E7DA8',
          400: '#3F4E7A',
          500: '#1E2D52',
          600: '#182034',   // Brand
          700: '#131A2A',
          800: '#0E1420',
          900: '#090E16',
          950: '#05080D',
        },
        cream: {
          50:  '#FFFBF2',
          100: '#FFF7E8',
          200: '#FFF1D9',   // Brand
          300: '#FFE8C2',
          400: '#FFDEA8',
          500: '#F5CE86',
        },
        gold: {
          50:  '#FFF4E0',
          100: '#FFE4B3',
          200: '#FFD080',
          300: '#FFBB4D',
          400: '#F5A31A',
          500: '#E68C04',   // Brand
          600: '#C47603',
          700: '#A26103',
          800: '#7A4902',
          900: '#523201',
        },
        rust: {
          50:  '#F8EAEA',
          100: '#E8C4C5',
          200: '#D49597',
          300: '#BF6568',
          400: '#A74548',
          500: '#8F2A2D',   // Brand
          600: '#782325',
          700: '#611C1E',
          800: '#4A1517',
          900: '#330E10',
        },
        neutral: {
          50:  '#F7F9F8',
          100: '#EEF1F0',
          200: '#DCE0DF',
          300: '#B8BFBE',
          400: '#8A9493',
          500: '#5E6A69',
          600: '#3D4A49',
          700: '#2A3433',
          800: '#1A2423',
          900: '#0D1413',
        },
        // Semantic
        success: { light: '#E8F5E9', DEFAULT: '#4A8B5C', dark: '#1E5631' },
        warning: { light: '#FFF4E0', DEFAULT: '#D49B2A', dark: '#7A4902' },
        error:   { light: '#F8EAEA', DEFAULT: '#A74548', dark: '#611C1E' },
        info:    { light: '#EAEDF3', DEFAULT: '#3F4E7A', dark: '#182034' },
      },

      fontFamily: {
        heading: ['Lexend', 'system-ui', '-apple-system', 'sans-serif'],
        body:    ['Zilla Slab', 'Georgia', 'Times New Roman', 'serif'],
      },

      fontSize: {
        'display': ['clamp(2.25rem, 1.5rem + 3.75vw, 4.188rem)', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'h1':      ['clamp(2rem, 1.5rem + 2.5vw, 3.125rem)',      { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.02em' }],
        'h2':      ['clamp(1.625rem, 1.25rem + 1.875vw, 2.375rem)', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],
        'h3':      ['clamp(1.375rem, 1.15rem + 1.125vw, 1.75rem)',  { lineHeight: '1.25', fontWeight: '600' }],
        'h4':      ['clamp(1.125rem, 1rem + 0.625vw, 1.313rem)',    { lineHeight: '1.3', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body':    ['1rem',     { lineHeight: '1.6', fontWeight: '400' }],
        'small':   ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'xs':      ['0.75rem',  { lineHeight: '1.4', fontWeight: '400' }],
      },

      spacing: {
        '1':  '0.25rem',    // 4px
        '2':  '0.5rem',     // 8px
        '3':  '0.75rem',    // 12px
        '4':  '1rem',       // 16px
        '6':  '1.5rem',     // 24px
        '8':  '2rem',       // 32px
        '12': '3rem',       // 48px
        '16': '4rem',       // 64px
        '24': '6rem',       // 96px
        '32': '8rem',       // 128px
      },

      maxWidth: {
        'container': '1280px',
        'text': '65ch',
      },

      borderRadius: {
        'btn': '0',
      },

      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },

      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
        'ease-in': 'cubic-bezier(0.4, 0.0, 1, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      },

      backgroundImage: {
        'gradient-cta': 'linear-gradient(to bottom, #182034, #8F2A2D)',
      },
    },
  },
  plugins: [],
};
```

---

## Font Face Declarations

```css
/* Lexend Bold — headings */
@font-face {
  font-family: 'Lexend';
  src: url('/fonts/lexend-bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
    U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC,
    U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

/* Zilla Slab Regular — body */
@font-face {
  font-family: 'Zilla Slab';
  src: url('/fonts/zilla-slab-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
    U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC,
    U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

/* Zilla Slab SemiBold — subheadings */
@font-face {
  font-family: 'Zilla Slab';
  src: url('/fonts/zilla-slab-semibold.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
    U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC,
    U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

/* Fallback font metric matching (prevents CLS) */
@font-face {
  font-family: 'Zilla Slab Fallback';
  src: local('Georgia');
  size-adjust: 103%;
  ascent-override: 93%;
  descent-override: 25%;
  line-gap-override: 0%;
}

@font-face {
  font-family: 'Lexend Fallback';
  src: local('Arial');
  size-adjust: 107%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
```

### Preload Tags (add to document head)

```html
<link rel="preload" href="/fonts/zilla-slab-regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/lexend-bold.woff2" as="font" type="font/woff2" crossorigin>
```

---

*These tokens implement the Got Moles design system. Reference `brand_context/design-system.md` for principles and usage rules.*
