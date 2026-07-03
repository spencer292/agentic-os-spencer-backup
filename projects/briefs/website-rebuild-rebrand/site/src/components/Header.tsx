'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'

interface NavItem {
  label: string
  url: string
  children?: { label: string; url: string }[]
}

interface HeaderProps {
  navItems?: NavItem[]
  ctaButton?: { text: string; url: string }
  phone?: string
}

const defaultNavItems: NavItem[] = [
  { label: 'How It Works', url: '/how-it-works' },
  {
    label: 'Services',
    url: '/services/',
    children: [
      { label: 'Year-Round Protection (TMCP)', url: '/services/total-mole-control-program' },
      { label: 'One-Time Removal', url: '/services/one-time-mole-removal' },
      { label: 'Commercial', url: '/services/commercial-mole-control' },
    ],
  },
  { label: 'Service Areas', url: '/service-areas' },
  { label: 'About', url: '/about' },
  { label: 'Contact', url: '/contact' },
]

const defaultPhone = '(253) 750-0211'

export function Header({ navItems, ctaButton: _ctaButton, phone }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const links = navItems && navItems.length > 0 ? navItems : defaultNavItems
  const phoneNumber = phone || defaultPhone

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // Close mobile menu + dropdowns on Escape key (accessibility)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (mobileOpen) {
        setMobileOpen(false)
        setMobileDropdownOpen(false)
      }
      if (dropdownOpen) setDropdownOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [mobileOpen, dropdownOpen])

  // Lock body scroll when mobile menu is open so background doesn't scroll
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [mobileOpen])

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-[100] focus:bg-gold-500 focus:text-blue-600 focus:px-4 focus:py-2 focus:font-bold">
        Skip to content
      </a>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-grass-700/95 backdrop-blur-sm shadow-lg'
            : ''
        }`}
        style={!scrolled ? { background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)' } : undefined}
      >
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* Logo — left */}
            <Link href="/" className="flex items-center no-underline shrink-0" aria-label="Got Moles — home">
              <Image
                src="/images/logo-cream.svg"
                alt="Got Moles"
                width={180}
                height={43}
                priority
                className="h-9 lg:h-11 w-auto"
              />
            </Link>

            {/* Nav — center, pill container */}
            <nav className="hidden lg:flex items-center">
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-full border border-cream-200/25 bg-black/20 backdrop-blur-sm">
                {links.map((link) => (
                  <div
                    key={link.label}
                    className="relative"
                    ref={link.children && link.children.length > 0 ? dropdownRef : undefined}
                  >
                    {link.children && link.children.length > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          aria-expanded={dropdownOpen}
                          aria-haspopup="true"
                          className="px-4 py-2 text-sm font-body font-semibold text-cream-200 hover:text-gold-500 transition-colors cursor-pointer rounded-full hover:bg-white/5 inline-flex items-center gap-1"
                        >
                          {link.label}
                          <svg
                            className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
                          </svg>
                        </button>
                        {dropdownOpen && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-grass-700/95 backdrop-blur-sm min-w-[260px] py-2 rounded-2xl shadow-xl border border-cream-200/10">
                            {link.children.map((child) => (
                              <Link
                                key={child.url}
                                href={child.url}
                                onClick={() => setDropdownOpen(false)}
                                className="block px-5 py-3 text-sm font-body text-cream-200 hover:text-gold-500 hover:bg-white/5 no-underline transition-colors"
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={link.url}
                        className="px-4 py-2 text-sm font-body font-semibold text-cream-200 hover:text-gold-500 transition-colors no-underline rounded-full hover:bg-white/5"
                      >
                        {link.label}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </nav>

            {/* Phone circle — right (desktop) */}
            <div className="hidden lg:flex items-center">
              <a
                href={`tel:${phoneNumber.replace(/[^0-9+]/g, '')}`}
                aria-label={`Call Got Moles at ${phoneNumber}`}
                className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-gold-500 hover:bg-gold-600 transition-colors"
              >
                <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </a>
            </div>

            {/* Mobile — phone circle + hamburger */}
            <div className="flex lg:hidden items-center gap-3">
              <a
                href={`tel:${phoneNumber.replace(/[^0-9+]/g, '')}`}
                aria-label="Call Got Moles"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gold-500 hover:bg-gold-600 transition-colors"
              >
                <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </a>
              <button
                onClick={() => { setMobileOpen(!mobileOpen); if (mobileOpen) setMobileDropdownOpen(false) }}
                className="p-2 text-cream-200"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-grass-700/95 backdrop-blur-sm border-t border-cream-200/10">
            <div className="px-4 py-4 space-y-1 max-w-[1280px] mx-auto">
              {links.map((link) => (
                <div key={link.label}>
                  {link.children && link.children.length > 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
                        className="w-full text-left px-3 py-3 text-base font-body font-semibold text-cream-200 flex justify-between items-center"
                      >
                        {link.label}
                        <svg
                          className={`w-4 h-4 text-cream-200/50 transition-transform ${mobileDropdownOpen ? 'rotate-180' : ''}`}
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
                        </svg>
                      </button>
                      {mobileDropdownOpen && link.children.map((child) => (
                        <Link
                          key={child.url}
                          href={child.url}
                          onClick={() => { setMobileOpen(false); setMobileDropdownOpen(false) }}
                          className="block px-6 py-3 text-sm font-body text-cream-200/80 no-underline"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </>
                  ) : (
                    <Link
                      href={link.url}
                      onClick={() => setMobileOpen(false)}
                      className="block px-3 py-3 text-base font-body font-semibold text-cream-200 no-underline"
                    >
                      {link.label}
                    </Link>
                  )}
                </div>
              ))}
              <a
                href={`tel:${phoneNumber.replace(/[^0-9+]/g, '')}`}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-3 mt-2 text-base font-heading font-bold uppercase tracking-[0.1em] bg-gold-500 text-blue-600 text-center no-underline rounded-2xl"
              >
                Call {phoneNumber}
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
