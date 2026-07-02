'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Leaderboard() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState('dark')
  const [currentUser, setCurrentUser] = useState(null)
  const [tab, setTab] = useState('searches')
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('ls_theme') || 'dark'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setCurrentUser(session.user)
      loadLeaderboard()
    })
  }, [])

  const loadLeaderboard = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, searches_used, created_at')
      .eq('is_active', true)
      .order('searches_used', { ascending: false })
      .limit(20)

    const withLeads = await Promise.all((profiles || []).map(async (p) => {
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', p.id)
      return { ...p, leads_count: count || 0 }
    }))

    setData(withLeads)
    setLoading(false)
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next); localStorage.setItem('ls_theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const sorted = [...data].sort((a, b) =>
    tab === 'searches' ? b.searches_used - a.searches_used : b.leads_count - a.leads_count
  )

  const medals = ['🥇', '🥈', '🥉']

  const maskEmail = (email) => {
    const [user, domain] = email.split('@')
    return user.slice(0, 2) + '***@' + domain
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#09090B', color: '#52525B', fontFamily: 'monospace', fontSize: '13px' }}>
      Loading leaderboard...
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root[data-theme="dark"] {
          --bg:#09090B; --s1:#111113; --s2:#18181B; --border:#27272A; --border2:#3F3F46;
          --text:#FAFAFA; --text2:#A1A1AA; --text3:#52525B;
          --green:#22C55E; --green-bg:#052E16; --green-b:rgba(34,197,94,0.15);
          --yellow:#EAB308; --nav:rgba(9,9,11,0.9);
        }
        :root[data-theme="light"] {
          --bg:#F9F9F7; --s1:#FFFFFF; --s2:#F4F4F2; --border:#E4E4E7; --border2:#D4D4D8;
          --text:#09090B; --text2:#52525B; --text3:#A1A1AA;
          --green:#16A34A; --green-bg:#F0FDF4; --green-b:rgba(22,163,74,0.2);
          --yellow:#CA8A04; --nav:rgba(249,249,247,0.9);
        }

        html { -webkit-font-smoothing: antialiased; }
        body { background: var(--bg); color: var(--text); font-family: 'Geist', sans-serif; min-height: 100vh; transition: background .2s, color .2s; }

        .topbar { height: 54px; border-bottom: 1px solid var(--border); display: flex; align-items: center; padding: 0 24px; background: var(--nav); backdrop-filter: blur(24px); position: sticky; top: 0; z-index: 100; gap: 12px; }
        .logo { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: var(--text); letter-spacing: -0.03em; text-decoration: none; }
        .logo-sq { width: 26px; height: 26px; background: var(--text); border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 13px; color: var(--bg); font-weight: 800; transition: background .2s, color .2s; }
        .sep { width: 1px; height: 18px; background: var(--border); }
        .topbar-r { margin-left: auto; display: flex; gap: 8px; align-items: center; }
        .theme-btn { width: 30px; height: 30px; border-radius: 7px; border: 1px solid var(--border); background: transparent; color: var(--text2); font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; }
        .theme-btn:hover { border-color: var(--border2); color: var(--text); }
        .back-btn { height: 30px; padding: 0 12px; border-radius: 7px; border: 1px solid var(--border); background: transparent; color: var(--text3); font-family: 'Geist', sans-serif; font-size: 12px; cursor: pointer; text-decoration: none; display: flex; align-items: center; transition: all .12s; }
        .back-btn:hover { border-color: var(--border2); color: var(--text2); }

        .main { max-width: 640px; margin: 0 auto; padding: 48px 24px 80px; }

        .page-title { font-size: 28px; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 6px; }
        .page-sub { font-size: 13px; color: var(--text3); margin-bottom: 32px; }

        .tabs { display: flex; gap: 4px; margin-bottom: 20px; background: var(--s1); border: 1px solid var(--border); border-radius: 10px; padding: 4px; }
        .tab { flex: 1; height: 34px; border-radius: 7px; border: none; background: transparent; color: var(--text3); font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all .15s; }
        .tab.on { background: var(--bg); border: 1px solid var(--border); color: var(--text); font-weight: 600; }

        .top3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
        .top3-card { background: var(--s1); border: 1px solid var(--border); border-radius: 12px; padding: 20px 14px; text-align: center; transition: border-color .15s; }
        .top3-card:hover { border-color: var(--border2); }
        .top3-card.first { border-color: rgba(234,179,8,0.3); background: rgba(234,179,8,0.03); }
        .top3-medal { font-size: 24px; margin-bottom: 8px; }
        .top3-email { font-size: 11px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
        .top3-val { font-size: 20px; font-weight: 700; letter-spacing: -0.03em; color: var(--text); }
        .top3-key { font-size: 10px; color: var(--text3); letter-spacing: .06em; text-transform: uppercase; }

        .list { background: var(--s1); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
        .list-hdr { display: grid; grid-template-columns: 40px 1fr 80px 80px; gap: 8px; padding: 10px 18px; border-bottom: 1px solid var(--border); }
        .list-th { font-size: 10px; font-weight: 600; color: var(--text3); letter-spacing: .08em; text-transform: uppercase; }
        .list-row { display: grid; grid-template-columns: 40px 1fr 80px 80px; gap: 8px; padding: 13px 18px; border-bottom: 1px solid var(--border); align-items: center; transition: background .1s; }
        .list-row:last-child { border-bottom: none; }
        .list-row:hover { background: var(--s2); }
        .list-row.me { background: var(--green-bg); border-left: 2px solid var(--green); }
        .list-rank { font-family: 'Geist Mono', monospace; font-size: 12px; color: var(--text3); }
        .list-email { font-size: 13px; font-weight: 500; color: var(--text); }
        .list-you { font-size: 10px; font-weight: 700; color: var(--green); background: var(--green-bg); border: 1px solid var(--green-b); padding: 2px 6px; border-radius: 5px; margin-left: 6px; }
        .list-val { font-size: 13px; font-weight: 600; color: var(--text); font-family: 'Geist Mono', monospace; }

        .footer { border-top: 1px solid var(--border); padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: var(--text3); }
        .footer strong { color: var(--text2); font-weight: 600; }

        @media(max-width: 520px) {
          .top3 { grid-template-columns: 1fr; }
          .list-hdr, .list-row { grid-template-columns: 30px 1fr 60px; }
          .hide-m { display: none; }
          .main { padding: 32px 16px 60px; }
        }
      `}</style>

      <header className="topbar">
        <a href="/" className="logo"><div className="logo-sq">LS</div>LandSea</a>
        <div className="sep" />
        <div className="topbar-r">
          <button className="theme-btn" onClick={toggleTheme}>{theme==='dark'?'☀':'☽'}</button>
          <a href="/dashboard" className="back-btn">← Dashboard</a>
        </div>
      </header>

      <main className="main">
        <div className="page-title">🏆 Leaderboard</div>
        <div className="page-sub">Top lead hunters on LandSea this month.</div>

        <div className="tabs">
          <button className={`tab ${tab==='searches'?'on':''}`} onClick={()=>setTab('searches')}>By Searches</button>
          <button className={`tab ${tab==='leads'?'on':''}`} onClick={()=>setTab('leads')}>By Leads Found</button>
        </div>

        {/* TOP 3 */}
        {sorted.length >= 3 && (
          <div className="top3">
            {[sorted[1], sorted[0], sorted[2]].map((u, i) => (
              <div key={u.id} className={`top3-card ${i===1?'first':''}`}>
                <div className="top3-medal">{i===1?'🥇':i===0?'🥈':'🥉'}</div>
                <div className="top3-email">{maskEmail(u.email)}</div>
                <div className="top3-val">{tab==='searches'?u.searches_used:u.leads_count}</div>
                <div className="top3-key">{tab==='searches'?'searches':'leads'}</div>
              </div>
            ))}
          </div>
        )}

        {/* FULL LIST */}
        <div className="list">
          <div className="list-hdr">
            <div className="list-th">#</div>
            <div className="list-th">User</div>
            <div className="list-th">Searches</div>
            <div className="list-th hide-m">Leads</div>
          </div>
          {sorted.map((u, i) => (
            <div key={u.id} className={`list-row ${u.id===currentUser?.id?'me':''}`}>
              <div className="list-rank">
                {i < 3 ? medals[i] : `#${i+1}`}
              </div>
              <div>
                <span className="list-email">{maskEmail(u.email)}</span>
                {u.id===currentUser?.id && <span className="list-you">You</span>}
              </div>
              <div className="list-val">{u.searches_used}</div>
              <div className="list-val hide-m">{u.leads_count}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="footer">
        <span>© 2025 LandSea </span>
        <span>Made with ♥ by <strong>Vibhansh</strong></span>
      </footer>
    </>
  )
}
