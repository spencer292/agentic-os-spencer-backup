import Script from 'next/script'

/**
 * Microsoft Clarity for Next.js (App Router).
 *
 * Heatmaps, session replay, rage and dead click detection, Smart Events and funnels.
 * Free, no traffic cap. Renders nothing unless NEXT_PUBLIC_CLARITY_PROJECT_ID is set,
 * so local development and preview builds stay clean.
 *
 * Consent. Clarity has enforced a consent signal for visitors from the UK, EEA and
 * Switzerland since 31 October 2025. Turn cookies OFF in the Clarity project
 * (Settings, Setup) and pass the decision with consentv2. The older boolean
 * clarity('consent', true) is deprecated and applies one state to both consent types.
 *
 * Usage in app/layout.tsx:
 *
 *   import { cookies } from 'next/headers'
 *   import { Clarity } from '@/components/Clarity'
 *
 *   const store = await cookies()
 *   const consent = store.get('cookie_consent')?.value === 'accepted'
 *
 *   <Clarity analyticsConsent={consent} adConsent={consent} />
 *
 * Then call updateClarityConsent(true) from the banner's accept handler and
 * withdrawClarityConsent() from its reject or withdraw handler.
 */

type ConsentState = 'granted' | 'denied'

export function Clarity({
  analyticsConsent = false,
  adConsent = false,
}: {
  analyticsConsent?: boolean
  adConsent?: boolean
}) {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID
  if (!projectId) return null

  const analyticsStorage: ConsentState = analyticsConsent ? 'granted' : 'denied'
  const adStorage: ConsentState = adConsent ? 'granted' : 'denied'

  return (
    <Script
      id="ms-clarity-init"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", ${JSON.stringify(projectId)});
          window.clarity("consentv2", {
            ad_Storage: ${JSON.stringify(adStorage)},
            analytics_Storage: ${JSON.stringify(analyticsStorage)}
          });
        `,
      }}
    />
  )
}

/** Call from the consent banner when the visitor accepts. */
export function updateClarityConsent(granted: boolean): void {
  if (typeof window === 'undefined') return
  const state: ConsentState = granted ? 'granted' : 'denied'
  try {
    window.clarity?.('consentv2', { ad_Storage: state, analytics_Storage: state })
  } catch {
    /* a blocked or missing tag must never break the page */
  }
}

/**
 * Call when the visitor withdraws consent. This is the one documented use of the
 * legacy call: it erases the Clarity cookies and stops tracking until consent
 * is granted again.
 */
export function withdrawClarityConsent(): void {
  if (typeof window === 'undefined') return
  try {
    window.clarity?.('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' })
    window.clarity?.('consent', false)
  } catch {
    /* ignore */
  }
}

declare global {
  interface Window {
    clarity?: (
      command: 'consent' | 'consentv2' | 'set' | 'identify' | 'event' | 'upgrade' | 'metadata',
      ...args: unknown[]
    ) => void
  }
}
