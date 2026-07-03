"""
Enrich Got Moles reviews from reviews.json for Payload CMS Testimonials collection.

Reads: projects/briefs/website-rebuild-rebrand/reference-data/reviews.json
Writes: projects/briefs/reviews-testimonials-seo/enriched-reviews.json

Enrichment:
- city: maps location -> "City, WA" format
- serviceType: classifies from review text (tmcp / one-time / commercial)
- concern: classifies from review text (effectiveness / safety / ongoing / professionalism / value)
- quote: extracts best 1-3 sentences from full text for card display
- gbpLocation: maps location -> location-1/2/3
- featured: top 6 by Spencer's rank
- status: published for all
- sortOrder: Spencer's rank
- rating: from stars field
- dateGiven: approximate from timeframe field
"""

import json
import re
from datetime import datetime, timedelta
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent
REVIEWS_PATH = SCRIPT_DIR.parent / "website-rebuild-rebrand" / "reference-data" / "reviews.json"
OUTPUT_PATH = SCRIPT_DIR / "enriched-reviews.json"

# Reference date for "X weeks ago" calculation (approximate: reviews scraped ~late 2024)
# Using 2025-01-01 as the reference since timeframes include "1 week ago" through "41 weeks ago"
# and dates like "Nov 2024", "Dec 2023" etc.
REFERENCE_DATE = datetime(2025, 1, 1)

# GBP location mapping
GBP_MAP = {
    "Seattle": "location-1",
    "Tacoma": "location-2",
    "Enumclaw": "location-3",
}

# City formatting
CITY_MAP = {
    "Seattle": "Seattle, WA",
    "Tacoma": "Tacoma, WA",
    "Enumclaw": "Enumclaw, WA",
}

# Service type classification keywords
TMCP_SIGNALS = [
    "monthly", "annual", "program", "subscription", "year-round",
    "ongoing", "every month", "regular visits", "routine",
    "monthly program", "annual customer", "long-term",
    "continued service", "maintenance", "prevention",
]

COMMERCIAL_SIGNALS = [
    "commercial", "church", "school", "property management",
    "HOA", "facility", "facilities", "office", "campus",
    "sports field", "golf course", "cemetery", "park",
    "our company", "our business", "my business", "our organization",
    "our property management", "our grounds",
]

# Concern classification keywords
CONCERN_KEYWORDS = {
    "effectiveness": [
        "tried everything", "nothing worked", "finally", "actually work",
        "moles removed", "mole free", "problem solved", "resolved",
        "got rid of", "eliminated", "no more moles", "yard is clean",
        "diy", "do it yourself", "traps didn't work", "poison",
        "castor oil", "sonic", "repellant", "grub control",
        "other companies", "pest company", "pest control",
        "yard", "lawn", "landscap", "turf", "grass", "garden",
        "damage", "holes", "mounds", "hills", "tunnels",
        "5 acres", "acre", "property",
    ],
    "professionalism": [
        "professional", "communication", "text me", "on time",
        "punctual", "responsive", "friendly", "courteous",
        "accommodating", "reliable", "dependable", "consistent",
        "appointment", "schedule", "prompt", "report",
    ],
    "value": [
        "price", "worth", "value", "reasonable", "affordable",
        "great price", "money well spent", "investment",
        "cost", "$", "pricy", "expensive",
    ],
    "safety": [
        "safe", "pet", "dog", "cat", "kids", "children",
        "child", "family", "non-toxic", "chemical-free",
        "no poison", "humane", "eco",
    ],
    "ongoing": [
        "monthly", "annual", "year-round", "ongoing",
        "continued", "maintenance", "prevention", "program",
        "subscription", "long-term", "keep coming back",
        "regular", "routine",
    ],
}


def classify_service_type(text: str) -> str:
    """Classify review into service type based on text signals."""
    text_lower = text.lower()

    # Check commercial first (most specific)
    for signal in COMMERCIAL_SIGNALS:
        if signal.lower() in text_lower:
            return "commercial"

    # Check TMCP signals
    for signal in TMCP_SIGNALS:
        if signal.lower() in text_lower:
            return "tmcp"

    # Default: one-time (Got Moles' entry point service)
    return "one-time"


def classify_concern(text: str) -> str:
    """Classify the primary concern from review text."""
    text_lower = text.lower()
    scores = {}

    for concern, keywords in CONCERN_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw.lower() in text_lower)
        scores[concern] = score

    # Return highest scoring concern, default to effectiveness
    if max(scores.values()) == 0:
        return "effectiveness"

    return max(scores, key=scores.get)


def extract_quote(text: str, max_chars: int = 200) -> str:
    """Extract the best 1-3 sentences for card display.

    Prefers sentences with specific outcomes, emotions, or recommendations.
    Falls back to first 1-2 sentences if nothing stands out.
    """
    # Handle reviews with no real text
    if "(4-star, no written review text)" in text or len(text) < 30:
        return text.strip()

    # Split into sentences (handle common abbreviations)
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    if not sentences:
        return text[:max_chars].strip()

    # Score each sentence for quote quality
    high_value_words = [
        "recommend", "best", "excellent", "amazing", "outstanding",
        "incredible", "fantastic", "perfect", "love", "trust",
        "solved", "resolved", "removed", "finally", "worth",
        "grateful", "thankful", "impressed", "professional",
        "5 star", "five star", "10/10", "hands down",
    ]

    scored = []
    for i, sentence in enumerate(sentences):
        score = 0
        s_lower = sentence.lower()

        # Boost sentences with high-value words
        for word in high_value_words:
            if word in s_lower:
                score += 2

        # Boost sentences with specific numbers
        if re.search(r'\d+', sentence):
            score += 1

        # Boost sentences that mention the company or team
        if any(name in s_lower for name in ["got moles", "spencer", "cory", "tavis", "brayden", "lukas"]):
            score += 1

        # Penalize very short sentences
        if len(sentence) < 20:
            score -= 1

        # Slight boost for earlier sentences (more context)
        if i < 2:
            score += 0.5

        scored.append((score, i, sentence))

    # Sort by score descending, take top sentences that fit in max_chars
    scored.sort(key=lambda x: (-x[0], x[1]))

    # Build quote from highest-scored sentences, in original order
    selected_indices = []
    current_length = 0

    for score, idx, sentence in scored:
        if current_length + len(sentence) + 1 <= max_chars:
            selected_indices.append(idx)
            current_length += len(sentence) + 1

    if not selected_indices:
        # Just take first sentence if nothing fits
        return sentences[0][:max_chars].strip()

    # Return in original order
    selected_indices.sort()
    quote = " ".join(sentences[i] for i in selected_indices)

    return quote.strip()


def parse_timeframe(timeframe: str) -> str:
    """Convert timeframe string to approximate ISO date.

    Handles: "X weeks ago", "Mon YYYY" formats.
    Returns YYYY-MM-DD string.
    """
    # "X weeks ago" format
    weeks_match = re.match(r"(\d+)\s+weeks?\s+ago", timeframe)
    if weeks_match:
        weeks = int(weeks_match.group(1))
        date = REFERENCE_DATE - timedelta(weeks=weeks)
        return date.strftime("%Y-%m-%d")

    # "Mon YYYY" format (e.g., "Nov 2024", "Dec 2023")
    month_year_match = re.match(r"([A-Za-z]+)\s+(\d{4})", timeframe)
    if month_year_match:
        try:
            date = datetime.strptime(timeframe, "%b %Y")
            return date.strftime("%Y-%m-%d")
        except ValueError:
            pass

    # Fallback
    return REFERENCE_DATE.strftime("%Y-%m-%d")


def enrich_reviews():
    """Main enrichment pipeline."""
    with open(REVIEWS_PATH, encoding="utf-8") as f:
        reviews = json.load(f)

    enriched = []
    stats = {
        "total": len(reviews),
        "service_types": {"tmcp": 0, "one-time": 0, "commercial": 0},
        "concerns": {},
        "cities": {},
        "featured": 0,
    }

    for review in reviews:
        text = review.get("text", "")
        location = review.get("location", "Seattle")
        rank = review.get("rank", 999)

        service_type = classify_service_type(text)
        concern = classify_concern(text)
        quote = extract_quote(text)
        city = CITY_MAP.get(location, f"{location}, WA")
        gbp_location = GBP_MAP.get(location, "location-1")
        date_given = parse_timeframe(review.get("timeframe", ""))
        featured = rank <= 6
        rating = review.get("stars", 5)

        enriched_review = {
            "name": review["name"],
            "city": city,
            "quote": quote,
            "fullQuote": text,
            "rating": rating,
            "serviceType": service_type,
            "concern": concern,
            "gbpLocation": gbp_location,
            "dateGiven": date_given,
            "featured": featured,
            "status": "published",
            "sortOrder": rank,
        }

        enriched.append(enriched_review)

        # Track stats
        stats["service_types"][service_type] += 1
        stats["concerns"][concern] = stats["concerns"].get(concern, 0) + 1
        stats["cities"][city] = stats["cities"].get(city, 0) + 1
        if featured:
            stats["featured"] += 1

    # Write enriched data
    output = {"meta": stats, "reviews": enriched}

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    # Print summary
    print(f"\nEnriched {stats['total']} reviews -> {OUTPUT_PATH}")
    print(f"\nService types:")
    for st, count in stats["service_types"].items():
        print(f"  {st}: {count}")
    print(f"\nConcerns:")
    for c, count in sorted(stats["concerns"].items(), key=lambda x: -x[1]):
        print(f"  {c}: {count}")
    print(f"\nCities:")
    for city, count in sorted(stats["cities"].items(), key=lambda x: -x[1]):
        print(f"  {city}: {count}")
    print(f"\nFeatured: {stats['featured']}")
    print(f"\nSample enriched review:")
    sample = enriched[0]
    print(f"  Name: {sample['name']}")
    print(f"  City: {sample['city']}")
    print(f"  Service type: {sample['serviceType']}")
    print(f"  Concern: {sample['concern']}")
    print(f"  Featured: {sample['featured']}")
    print(f"  Quote: {sample['quote'][:100]}...")
    print(f"  Date: {sample['dateGiven']}")


if __name__ == "__main__":
    enrich_reviews()
