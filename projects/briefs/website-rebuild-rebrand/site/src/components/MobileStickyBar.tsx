'use client'

import { useState, useEffect } from 'react'

interface MobileStickyBarProps {
  phone?: string
}

export function MobileStickyBar({ phone = '(253) 750-0211' }: MobileStickyBarProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden shadow-[0_-2px_8px_rgba(0,0,0,0.15)]">
      <a
        href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
        className="flex items-center justify-center gap-2 h-14 bg-gold-500 text-blue-600 font-heading font-bold text-sm uppercase tracking-[0.1em] no-underline"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        Call {phone}
      </a>
    </div>
  )
}
