import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  try {
    const { userId, email, name } = await req.json()
    
    // Save request to Supabase table
    await supabase.from('pro_requests').insert({
      user_id: userId,
      email,
      name: name || email,
      status: 'pending',
      created_at: new Date().toISOString()
    })

    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
