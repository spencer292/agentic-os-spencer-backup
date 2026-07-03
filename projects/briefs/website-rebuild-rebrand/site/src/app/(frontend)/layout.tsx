import type { Metadata } from 'next'
import Script from 'next/script'
import { GoogleTagManager } from '@next/third-parties/google'
import { CmsHeader } from '@/components/CmsHeader'
import { CmsFooter } from '@/components/CmsFooter'
import { HideOnLp } from '@/components/HideOnLp'
import { MobileStickyBar } from '@/components/MobileStickyBar'
import { TrackingDelegator } from '@/components/TrackingDelegator'
import { JsonLd, organizationSchema } from '@/lib/schema'
import '../globals.css'

export const metadata: Metadata = {
  title: {
    default: "Got Moles | Washington's Mole Control Specialist",
    template: '%s | Got Moles',
  },
  description:
    "Got Moles is Western Washington's mole-exclusive specialist. Chemical-free, proven results. Nearly 5,000 clients served since 2017. Call (253) 750-0211.",
  metadataBase: new URL('https://got-moles.com'),
  openGraph: {
    type: 'website',
    siteName: 'Got Moles',
    images: [{ url: '/images/og-default.webp', width: 1200, height: 630, alt: 'Got Moles — Professional Mole Control in Western Washington' }],
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#184241',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/lexend-bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/zilla-slab-regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/zilla-slab-semibold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <JsonLd data={organizationSchema()} />
      </head>
      <body className="bg-cream-50 text-neutral-800 font-body antialiased pb-14 lg:pb-0">
        <HideOnLp><CmsHeader /></HideOnLp>
        <main id="main-content" className="flex-1">{children}</main>
        <HideOnLp><CmsFooter /></HideOnLp>
        <MobileStickyBar />
        <TrackingDelegator />
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
        )}
        {process.env.NEXT_PUBLIC_CALLRAIL_COMPANY_ID && process.env.NEXT_PUBLIC_CALLRAIL_KEY && (
          <Script
            id="callrail-swap"
            src={`//cdn.callrail.com/companies/${process.env.NEXT_PUBLIC_CALLRAIL_COMPANY_ID}/${process.env.NEXT_PUBLIC_CALLRAIL_KEY}/12/swap.js`}
            strategy="afterInteractive"
          />
        )}
        {/* Microsoft Clarity — heatmaps, session replay, rage-click, dead-click,
            scroll-depth, JS error tracking. Free unlimited sessions. Data flows
            once Spencer creates the project at clarity.microsoft.com (Google
            OAuth, "Got Moles site") and Roy adds NEXT_PUBLIC_CLARITY_PROJECT_ID
            to Vercel. See projects/briefs/got-moles-measurement-setup/2026-05-03_clarity-install-plan.md */}
        {process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID && (
          <Script id="ms-clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID}");`}
          </Script>
        )}
      </body>
    </html>
  )
}
