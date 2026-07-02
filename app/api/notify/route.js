// Email notifications via Resend (free — 3000 emails/month)
// Setup: resend.com → get API key → add RESEND_API_KEY to Vercel env vars

export async function POST(req) {
  try {
    const { to, leadName, oldStatus, newStatus, businessType, location } = await req.json()

    if (!process.env.RESEND_API_KEY) {
      return Response.json({ ok: false, error: 'RESEND_API_KEY not set' })
    }

    const statusEmoji = {
      new: '🆕', contacted: '📞', interested: '🎯', closed: '✅', rejected: '❌'
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"/></head>
      <body style="margin:0;padding:0;background:#F9F9F7;font-family:system-ui,sans-serif">
        <div style="max-width:480px;margin:40px auto;background:#FFFFFF;border:1px solid #E4E4E7;border-radius:12px;overflow:hidden">
          <div style="background:#09090B;padding:24px">
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:24px;height:24px;background:#FAFAFA;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#09090B;text-align:center;line-height:24px">L</div>
              <span style="color:#FAFAFA;font-size:14px;font-weight:700;letter-spacing:-0.02em">landsea</span>
            </div>
          </div>
          <div style="padding:28px">
            <div style="font-size:13px;font-weight:500;color:#52525B;letter-spacing:.06em;text-transform:uppercase;margin-bottom:12px">Lead Status Update</div>
            <div style="font-size:22px;font-weight:700;color:#09090B;letter-spacing:-0.03em;margin-bottom:4px">${leadName}</div>
            <div style="font-size:13px;color:#A1A1AA;margin-bottom:24px">${businessType} · ${location}</div>
            <div style="display:flex;align-items:center;gap:12px;padding:16px;background:#F4F4F2;border-radius:10px;margin-bottom:24px">
              <div style="text-align:center">
                <div style="font-size:11px;color:#A1A1AA;margin-bottom:4px">FROM</div>
                <div style="font-size:14px;font-weight:600;color:#09090B">${statusEmoji[oldStatus]||''} ${oldStatus}</div>
              </div>
              <div style="font-size:18px;color:#D4D4D8">→</div>
              <div style="text-align:center">
                <div style="font-size:11px;color:#A1A1AA;margin-bottom:4px">TO</div>
                <div style="font-size:14px;font-weight:700;color:#09090B">${statusEmoji[newStatus]||''} ${newStatus}</div>
              </div>
            </div>
            <a href="https://leadsgenvib.vercel.app/dashboard" style="display:block;text-align:center;padding:12px;background:#09090B;color:#FAFAFA;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">
              View Dashboard →
            </a>
          </div>
          <div style="padding:16px 28px;border-top:1px solid #E4E4E7;font-size:11px;color:#A1A1AA;text-align:center">
            © 2025 landsea · Made by Vibhansh
          </div>
        </div>
      </body>
      </html>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'landsea <onboarding@resend.dev>',
        to: [to],
        subject: `${statusEmoji[newStatus]} Lead "${leadName}" is now ${newStatus}`,
        html
      })
    })

    if (!res.ok) {
      const err = await res.json()
      return Response.json({ ok: false, error: err })
    }

    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ ok: false, error: e.message })
  }
}
