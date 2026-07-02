'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [theme, setTheme] = useState('dark')
  const router = useRouter()

  useEffect(() => {
    // If already logged in, go to dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
    })
    const saved = localStorage.getItem('ls_theme') || 'dark'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  const handleGoogle = async () => {
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
    if (err) { setError(err.message); setLoading(false) }
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('ls_theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root[data-theme="dark"] {
          --bg: #09090B; --s1: #111113; --border: #27272A; --border2: #3F3F46;
          --text: #FAFAFA; --text2: #A1A1AA; --text3: #52525B;
          --green: #22C55E; --green-bg: #052E16; --green-b: rgba(34,197,94,0.15);
          --red: #EF4444; --red-bg: #1C0A0A; --red-b: rgba(239,68,68,0.2);
        }
        :root[data-theme="light"] {
          --bg: #F9F9F7; --s1: #FFFFFF; --border: #E4E4E7; --border2: #D4D4D8;
          --text: #09090B; --text2: #52525B; --text3: #A1A1AA;
          --green: #16A34A; --green-bg: #F0FDF4; --green-b: rgba(22,163,74,0.2);
          --red: #DC2626; --red-bg: #FEF2F2; --red-b: rgba(220,38,38,0.2);
        }

        html { -webkit-font-smoothing: antialiased; }
        body { background: var(--bg); color: var(--text); font-family: 'Geist', sans-serif; min-height: 100vh; transition: background .2s, color .2s; }

        .page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        /* LEFT SIDE */
        .left {
          background: #09090B;
          border-right: 1px solid #1A1A1C;
          display: flex; flex-direction: column;
          padding: 40px;
          position: relative;
          overflow: hidden;
        }

        .left-glow {
          position: absolute;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%);
          bottom: -100px; left: -100px;
          pointer-events: none;
        }

        .left-logo {
          display: flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 700; color: #FAFAFA;
          letter-spacing: -0.02em;
        }

        .left-logo-sq {
          width: 26px; height: 26px; background: #FAFAFA;
          border-radius: 7px; display: flex; align-items: center;
          justify-content: center; font-size: 13px; color: #09090B; font-weight: 800;
        }

        .left-content {
          flex: 1; display: flex; flex-direction: column;
          justify-content: center; padding: 20px 0;
        }

        .left-tag {
          font-size: 11px; font-weight: 600; color: #22C55E;
          letter-spacing: .1em; text-transform: uppercase;
          margin-bottom: 20px;
          display: flex; align-items: center; gap: 8px;
        }

        .left-tag::before {
          content: ''; width: 20px; height: 1px; background: #22C55E; opacity: .5;
        }

        .left-title {
          font-size: clamp(28px, 3vw, 42px);
          font-weight: 800; letter-spacing: -0.05em;
          line-height: 1.05; color: #FAFAFA; margin-bottom: 16px;
        }

        .left-title .muted { color: #3F3F46; }

        .left-sub {
          font-size: 14px; color: #71717A; line-height: 1.7;
          max-width: 320px; margin-bottom: 40px;
        }

        .left-stats {
          display: flex; flex-direction: column; gap: 12px;
        }

        .left-stat {
          display: flex; align-items: center; gap: 12px;
          font-size: 13px; color: #71717A;
        }

        .left-stat-icon {
          width: 32px; height: 32px;
          background: #18181B; border: 1px solid #27272A;
          border-radius: 8px; display: flex; align-items: center;
          justify-content: center; font-size: 14px; flex-shrink: 0;
        }

        .left-footer {
          font-size: 11px; color: #3F3F46;
        }

        /* RIGHT SIDE */
        .right {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 40px; position: relative;
          background: var(--bg);
        }

        .theme-btn {
          position: absolute; top: 24px; right: 24px;
          width: 34px; height: 34px; border-radius: 8px;
          border: 1px solid var(--border); background: transparent;
          color: var(--text2); font-size: 15px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .15s;
        }
        .theme-btn:hover { border-color: var(--border2); color: var(--text); }

        .right-inner { width: 100%; max-width: 340px; }

        .right-title {
          font-size: 22px; font-weight: 700;
          letter-spacing: -0.03em; color: var(--text);
          margin-bottom: 6px;
        }

        .right-sub {
          font-size: 13px; color: var(--text3);
          margin-bottom: 32px;
        }

        .google-btn {
          width: 100%; height: 44px;
          background: var(--s1); border: 1px solid var(--border);
          border-radius: 10px; color: var(--text);
          font-family: 'Geist', sans-serif; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all .15s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          letter-spacing: -0.01em;
        }

        .google-btn:hover:not(:disabled) { border-color: var(--border2); background: var(--s1); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .google-btn:active { transform: translateY(0); }
        .google-btn:disabled { opacity: .5; cursor: not-allowed; }

        .err-box {
          margin-top: 14px; padding: 10px 12px;
          background: var(--red-bg); border: 1px solid var(--red-b);
          border-radius: 8px; font-size: 12px; color: var(--red);
          display: flex; align-items: center; gap: 7px;
        }

        .right-note {
          margin-top: 24px; padding-top: 24px;
          border-top: 1px solid var(--border);
          font-size: 11px; color: var(--text3);
          text-align: center; line-height: 1.7;
        }

        .right-note a { color: var(--text2); text-decoration: none; }
        .right-note a:hover { text-decoration: underline; }

        @media(max-width: 680px) {
          .page { grid-template-columns: 1fr; }
          .left { display: none; }
          .right { padding: 24px; min-height: 100vh; }
        }
      `}</style>

      <div className="page">
        {/* LEFT */}
        <div className="left">
          <div className="left-glow" />
          <div className="left-logo">
            <div className="left-logo-sq">LS</div>
            LandSea
          </div>
          <div className="left-content">
            <div className="left-tag">India Business Intelligence</div>
            <h1 className="left-title">
              Find your next<br />
              client <span className="muted">today.</span>
            </h1>
            <p className="left-sub">
              Discover local businesses with no online presence. Your next paying client is one search away.
            </p>
            <div className="left-stats">
              <div className="left-stat">
                <div className="left-stat-icon">⚡</div>
                Instant results from Google Maps
              </div>
              <div className="left-stat">
                <div className="left-stat-icon">🎯</div>
                Filter businesses with no website
              </div>
              <div className="left-stat">
                <div className="left-stat-icon">📊</div>
                Track and manage your leads
              </div>
            </div>
          </div>
          <div className="left-footer">© 2025 LandSea · Made by Vibhansh</div>
        </div>

        {/* RIGHT */}
        <div className="right">
          <button className="theme-btn" onClick={toggleTheme}>{theme==='dark'?'☀':'☽'}</button>
          <div className="right-inner">
            <div className="right-title">Welcome back</div>
            <div className="right-sub">Sign in to access your dashboard.</div>

            <button className="google-btn" onClick={handleGoogle} disabled={loading}>
              {loading ? 'Redirecting...' : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            {error && <div className="err-box">⚠ {error}</div>}

            <div className="right-note">
              By signing in, you agree to our terms.<br />
              New here? Just sign in — account auto-created. 🚀
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
