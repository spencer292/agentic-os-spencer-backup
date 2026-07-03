'use client'

import { useState, useMemo } from 'react'

export interface Testimonial {
  id: string
  name: string
  city: string
  quote: string
  fullQuote: string
  rating: number
  serviceType: 'tmcp' | 'one-time' | 'commercial' | null
  concern: 'effectiveness' | 'safety' | 'ongoing' | 'professionalism' | 'value' | null
  gbpLocation: 'location-1' | 'location-2' | 'location-3' | null
  dateGiven: string | null
  featured: boolean
  sortOrder: number
}

const SERVICE_LABELS: Record<string, string> = {
  'all': 'All Reviews',
  'tmcp': 'Monthly Program',
  'one-time': 'One-Time Removal',
  'commercial': 'Commercial',
}

const CITY_LABELS: Record<string, string> = {
  'all': 'All Areas',
  'Seattle, WA': 'Seattle',
  'Tacoma, WA': 'Tacoma',
  'Enumclaw, WA': 'Enumclaw',
}

const CITY_GEO: Record<string, string> = {
  'Seattle, WA': 'Got Moles has earned 96 five-star Google reviews from homeowners across Seattle and the Eastside, including Sammamish, Bellevue, Issaquah, and Federal Way. Seattle-area customers report lasting results after years of failed DIY attempts and general pest companies that couldn\'t solve the problem.',
  'Tacoma, WA': 'Tacoma-area homeowners have given Got Moles 61 five-star reviews, the highest-rated mole control service in Pierce County. Customers across Tacoma, Puyallup, and surrounding areas highlight reliable scheduling, professional communication, and year-round protection through the monthly program.',
  'Enumclaw, WA': 'Got Moles holds 26 five-star reviews from the Enumclaw and rural King County area, where larger properties and agricultural land create persistent mole problems. Customers describe Got Moles as responsive, effective, and worth every dollar.',
}

const REVIEWS_PER_PAGE = 12

function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-1" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="w-5 h-5 text-gold-500 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function ServiceBadge({ type }: { type: string }) {
  const label = SERVICE_LABELS[type] || type
  return (
    <span className="inline-block text-xs font-body bg-white/10 text-cream-200/70 rounded-full px-3 py-1">
      {label}
    </span>
  )
}

function ReviewCard({ review, expanded, onToggle }: {
  review: Testimonial
  expanded: boolean
  onToggle: () => void
}) {
  const needsTruncation = review.fullQuote.length > 200
  const displayText = expanded || !needsTruncation
    ? review.fullQuote
    : review.quote

  return (
    <article className="bg-white/5 rounded-2xl p-6 lg:p-8 hover:bg-white/10 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <Stars count={review.rating} />
        {review.serviceType && <ServiceBadge type={review.serviceType} />}
      </div>

      <blockquote className="font-body text-body text-cream-200/80 leading-relaxed mb-4">
        {displayText}
        {needsTruncation && !expanded && '...'}
      </blockquote>

      {needsTruncation && (
        <button
          onClick={onToggle}
          className="font-body text-sm text-gold-500 hover:text-gold-400 mb-4"
        >
          {expanded ? 'Show less' : 'Read full review'}
        </button>
      )}

      <footer>
        <cite className="not-italic block">
          <span className="font-body text-sm font-semibold text-cream-200">
            {review.name}
          </span>
          <span className="font-body text-sm text-cream-200/65 block mt-0.5">
            {review.city}
          </span>
        </cite>
      </footer>
    </article>
  )
}

function FeaturedReview({ review }: { review: Testimonial }) {
  return (
    <article className="text-center max-w-3xl mx-auto mb-12 last:mb-0">
      <div className="flex justify-center gap-1 mb-3">
        <Stars count={review.rating} />
      </div>
      <span className="font-heading text-gold-500 text-5xl leading-none block mb-2" aria-hidden="true">&ldquo;</span>
      <blockquote className="font-body text-body-lg text-cream-200 leading-relaxed italic mb-6">
        {review.fullQuote}
      </blockquote>
      <footer>
        <cite className="not-italic block">
          <span className="font-body text-sm font-semibold text-cream-200">
            {review.name}
          </span>
          {review.serviceType && (
            <span className="mx-2 text-cream-200/40">&middot;</span>
          )}
          {review.serviceType && <ServiceBadge type={review.serviceType} />}
          <span className="font-body text-sm text-cream-200/65 block mt-1">
            {review.city}
          </span>
        </cite>
      </footer>
    </article>
  )
}

export function ReviewsHub({ testimonials }: { testimonials: Testimonial[] }) {
  const [serviceFilter, setServiceFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [visibleCount, setVisibleCount] = useState(REVIEWS_PER_PAGE)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  const featured = useMemo(
    () => testimonials.filter((t) => t.featured).sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 3),
    [testimonials],
  )

  const filtered = useMemo(() => {
    return testimonials
      .filter((t) => !t.featured)
      .filter((t) => serviceFilter === 'all' || t.serviceType === serviceFilter)
      .filter((t) => cityFilter === 'all' || t.city === cityFilter)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }, [testimonials, serviceFilter, cityFilter])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const serviceCounts = useMemo(() => {
    const counts: Record<string, number> = { all: testimonials.filter(t => !t.featured).length }
    for (const t of testimonials) {
      if (t.featured) continue
      if (t.serviceType) counts[t.serviceType] = (counts[t.serviceType] || 0) + 1
    }
    return counts
  }, [testimonials])

  const cityCounts = useMemo(() => {
    const base = serviceFilter === 'all'
      ? testimonials.filter(t => !t.featured)
      : testimonials.filter(t => !t.featured && t.serviceType === serviceFilter)
    const counts: Record<string, number> = { all: base.length }
    for (const t of base) {
      counts[t.city] = (counts[t.city] || 0) + 1
    }
    return counts
  }, [testimonials, serviceFilter])

  const handleServiceFilter = (value: string) => {
    setServiceFilter(value)
    setVisibleCount(REVIEWS_PER_PAGE)
  }

  const handleCityFilter = (value: string) => {
    setCityFilter(value)
    setVisibleCount(REVIEWS_PER_PAGE)
  }

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      {/* Featured Reviews */}
      <section
        className="py-12 lg:py-24 text-cream-200"
        style={{ background: 'linear-gradient(to bottom, #184241, #153635)' }}
      >
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
          <h2
            className="font-heading text-h2 uppercase tracking-tight mb-12 text-center"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            What Western Washington Homeowners Say About Got Moles
          </h2>
          {featured.map((review) => (
            <FeaturedReview key={review.id} review={review} />
          ))}
        </div>
      </section>

      {/* Filter Bar + City GEO + Review Grid */}
      <section
        className="py-12 lg:py-24 text-cream-200"
        style={{ background: 'linear-gradient(to bottom, #153635, #184241)' }}
      >
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
          {/* Filter heading */}
          <h2
            className="font-body font-semibold text-h3 text-cream-200 text-center mb-8"
          >
            Find Reviews That Match Your Situation
          </h2>

          {/* Service type filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {Object.entries(SERVICE_LABELS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => handleServiceFilter(value)}
                className={`rounded-full px-4 py-2 text-sm font-body font-semibold transition-colors ${
                  serviceFilter === value
                    ? 'bg-gold-500 text-blue-600'
                    : 'bg-white/5 text-cream-200 hover:bg-white/10'
                }`}
              >
                {label}
                {serviceCounts[value] !== undefined && (
                  <span className="ml-1.5 text-xs opacity-70">({serviceCounts[value]})</span>
                )}
              </button>
            ))}
          </div>

          {/* City filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {Object.entries(CITY_LABELS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => handleCityFilter(value)}
                className={`rounded-full px-4 py-2 text-sm font-body font-semibold transition-colors ${
                  cityFilter === value
                    ? 'bg-gold-500 text-blue-600'
                    : 'bg-white/5 text-cream-200 hover:bg-white/10'
                }`}
              >
                {label}
                {cityCounts[value] !== undefined && (
                  <span className="ml-1.5 text-xs opacity-70">({cityCounts[value]})</span>
                )}
              </button>
            ))}
          </div>

          {/* City GEO paragraph (conditional) */}
          {cityFilter !== 'all' && CITY_GEO[cityFilter] && (
            <div className="max-w-[65ch] mx-auto mb-12">
              <p className="font-body text-body-lg text-cream-200/80 leading-relaxed text-center">
                {CITY_GEO[cityFilter]}
              </p>
            </div>
          )}

          {/* Results count */}
          <p className="font-body text-small text-cream-200/65 text-center mb-8">
            Showing {visible.length} of {filtered.length} reviews
          </p>

          {/* Review grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {visible.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                expanded={expandedCards.has(review.id)}
                onToggle={() => toggleCard(review.id)}
              />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="text-center mt-10">
              <button
                onClick={() => setVisibleCount((c) => c + REVIEWS_PER_PAGE)}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/5 text-cream-200 font-heading font-bold text-sm uppercase tracking-[0.1em] hover:bg-white/10 transition-colors"
              >
                Load More Reviews
                <span className="text-xs opacity-70">
                  ({filtered.length - visibleCount} remaining)
                </span>
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
