// AdWords landing pages: site header + full footer nav are hidden via HideOnLp in
// the root layout (conversion focus). This minimal footer keeps Privacy + Terms
// (Google Ads requires a privacy policy on a form-collecting page) + phone.
export default function LPLayout({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear()
  return (
    <>
      {children}
      <footer className="bg-grass-700 text-cream-200/70 py-8 px-4 text-center font-body text-sm">
        <p>
          Got Moles — Western Washington&apos;s mole specialists ·{' '}
          <a href="tel:+12537500211" className="text-gold-500 underline">(253) 750-0211</a>
        </p>
        <p className="mt-2">
          <a href="/privacy/" className="text-gold-500 underline">Privacy Policy</a> ·{' '}
          <a href="/terms/" className="text-gold-500 underline">Terms of Service</a> · © {year} Got Moles
        </p>
      </footer>
    </>
  )
}
