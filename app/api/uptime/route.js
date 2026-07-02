export async function GET() {
  try {
    const res = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        api_key: 'u1644666-829f70e27f385cb5ff434e71',
        format: 'json',
        logs: '0',
        response_times: '0',
        custom_uptime_ratios: '30',
      })
    })
    const data = await res.json()
    const monitor = data.monitors?.[0]
    if (!monitor) return Response.json(null)
    return Response.json({
      status: monitor.status,
      uptime_ratio: monitor.custom_uptime_ratio,
      friendly_name: monitor.friendly_name,
    })
  } catch {
    return Response.json(null)
  }
}
