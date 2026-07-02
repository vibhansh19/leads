'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function SignUp() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleGoogle = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#09090B;color:#FAFAFA;font-family:'Geist',sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px}
        .wrap{width:100%;max-width:420px;display:flex;flex-direction:column;align-items:center;gap:0}
        .logo{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700;letter-spacing:-0.03em;margin-bottom:40px;cursor:pointer}
        .logo-sq{width:28px;height:28px;background:#FAFAFA;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#09090B;font-weight:800}
        .badge{font-size:11px;font-weight:600;color:#22C55E;background:#052E16;border:1px solid rgba(34,197,94,0.2);padding:4px 12px;border-radius:99px;margin-bottom:28px;letter-spacing:.06em;text-transform:uppercase}
        h1{font-size:32px;font-weight:900;letter-spacing:-0.05em;line-height:1;margin-bottom:10px;text-align:center}
        .sub{font-size:14px;color:#52525B;margin-bottom:36px;text-align:center;line-height:1.6}
        .sub span{color:#A1A1AA}
        .google-btn{width:100%;height:52px;border-radius:12px;border:1px solid #27272A;background:#111113;color:#FAFAFA;font-family:'Geist',sans-serif;font-size:15px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:12px;transition:all .15s;margin-bottom:20px;letter-spacing:-0.01em}
        .google-btn:hover{background:#18181B;border-color:#3F3F46}
        .google-btn:disabled{opacity:.5;cursor:not-allowed}
        .g-icon{width:20px;height:20px;flex-shrink:0}
        .perks{width:100%;display:flex;flex-direction:column;gap:10px;margin-bottom:28px}
        .perk{display:flex;align-items:center;gap:10px;font-size:13px;color:#A1A1AA}
        .perk-dot{width:6px;height:6px;border-radius:50%;background:#22C55E;flex-shrink:0}
        .divider{width:100%;height:1px;background:#1A1A1D;margin-bottom:20px}
        .footer-text{font-size:12px;color:#3F3F46;text-align:center;line-height:1.7}
        .footer-text a{color:#52525B;text-decoration:none;cursor:pointer}
        .footer-text a:hover{color:#A1A1AA}
        .bottom{position:fixed;bottom:24px;font-size:11px;color:#27272A}
      `}</style>

      <div className="wrap">
        <div className="logo" onClick={() => router.push('/')}>
          <div className="logo-sq">LS</div>LandSea
        </div>

        <div className="badge">Free · No credit card</div>

        <h1>Start finding<br/>clients today.</h1>
        <p className="sub">Join LandSea and discover local businesses<br/><span>that need your services — for free.</span></p>

        <div className="perks">
          {['10 free searches every month','Find businesses with no website','Export leads to CSV & Excel','AI pitch generator included'].map(p => (
            <div key={p} className="perk"><div className="perk-dot"/>{p}</div>
          ))}
        </div>

        <button className="google-btn" onClick={handleGoogle} disabled={loading}>
          {loading ? 'Redirecting...' : (
            <>
              <svg className="g-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Create free account with Google
            </>
          )}
        </button>

        <div className="divider"/>

        <div className="footer-text">
          Already have an account? <a onClick={() => router.push('/login')}>Login →</a><br/>
          By signing up, you agree to our terms of service.
        </div>
      </div>

      <div className="bottom">© 2026 LandSea · Made by Vibhansh</div>
    </>
  )
}
