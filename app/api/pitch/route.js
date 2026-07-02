export async function POST(req) {
  try {
    const { name, category, city, hasWebsite, phone } = await req.json()

    const prompt = `You are an expert cold outreach specialist for Indian freelance web developers.

Write a short, personalized WhatsApp message to pitch web development services to this business:

Business Name: ${name}
Category: ${category}
City: ${city}
Has Website: ${hasWebsite ? 'Yes (offer redesign)' : 'No (offer new website)'}

Requirements:
- Max 4 lines
- Mention their business name and city
- If no website: focus on what they are missing
- If has website: offer redesign or improvement
- Soft call to action at the end
- Friendly, professional, human tone
- English only
- Max 2 emojis
- Include a starting price in INR (between ₹8,000 - ₹15,000)

Return ONLY the WhatsApp message, nothing else.`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('Groq error:', err)
      throw new Error('AI generation failed')
    }

    const data = await res.json()
    const pitch = data.choices?.[0]?.message?.content?.trim()

    return Response.json({ pitch })
  } catch(e) {
    console.error('Pitch error:', e)
    return Response.json({
      pitch: `Hi, I noticed ${''} could benefit from a professional website. I build websites for local businesses starting at ₹8,000. Interested in a free consultation?`
    })
  }
}
