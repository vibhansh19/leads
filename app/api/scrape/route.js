export const maxDuration = 300

export async function POST(req) {
  try {
    const { businessType, location, maxResults, userId, source } = await req.json()
    if (!businessType || !location) return Response.json({ error: 'Missing fields' }, { status: 400 })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    let isPro = false
    if (userId) {
      const { data: profile } = await supabase.from('profiles').select('role,is_pro').eq('id', userId).single()
      isPro = profile?.role === 'admin' || profile?.is_pro === true
    }

    const limit = maxResults || 5

    // SerpAPI for Pro users who chose 'api' source
    if (isPro && source === 'api' && process.env.SERPAPI_KEY) {
      const leads = await scrapeViaSerpAPI(businessType, location, limit)
      return Response.json({ leads, source: 'serpapi' })
    }

    // HF scraper — returns data directly now, no polling
    const HF_URL = process.env.HF_SCRAPER_URL
    const HF_TOKEN = process.env.HF_AUTH_TOKEN
    if (!HF_URL) return Response.json({ error: 'HF_SCRAPER_URL not set' }, { status: 500 })

    const hfRes = await fetch(`${HF_URL}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: businessType, city: location, token: HF_TOKEN, limit }),
      signal: AbortSignal.timeout(280000) // 280s — within Vercel 300s limit
    })

    if (!hfRes.ok) throw new Error(`HF error: ${hfRes.status}`)

    const hfData = await hfRes.json()
    const raw = hfData.leads || []

    // Deduplicate
    const seen = new Set()
    const leads = raw.filter(l => {
      const key = l.name?.toLowerCase().trim()
      if (!key || key === 'unknown' || seen.has(key)) return false
      seen.add(key)
      return true
    }).map(l => ({
      name: l.name || '—',
      phone: l.phone || null,
      address: l.address || null,
      website: l.website || null,
      hasWebsite: !!l.website,
      rating: l.rating || null,
      reviews: l.reviews || null,
      category: l.category,
      url: l.maps_url || null
    }))

    return Response.json({ leads, source: 'hf' })

  } catch (e) {
    console.error('Scrape error:', e)
    return Response.json({ error: e.message || 'Scraping failed' }, { status: 500 })
  }
}

async function scrapeViaSerpAPI(businessType, location, limit) {
  const params = new URLSearchParams({
    engine: 'google_maps', q: `${businessType} in ${location} India`,
    type: 'search', api_key: process.env.SERPAPI_KEY, hl: 'en', gl: 'in', num: String(limit)
  })
  const res = await fetch(`https://serpapi.com/search?${params}`)
  if (!res.ok) throw new Error('SerpAPI failed')
  const data = await res.json()
  return (data.local_results || []).slice(0, limit).map(r => ({
    name: r.title, phone: r.phone || null, address: r.address || null,
    website: r.website || null, hasWebsite: !!r.website,
    rating: r.rating ? String(r.rating) : null, reviews: r.reviews ? String(r.reviews) : null,
    category: r.type || businessType, url: r.links?.google_page || null
  }))
}
