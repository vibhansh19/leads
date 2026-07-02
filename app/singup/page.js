'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!email || !password || !confirm) { setError('All fields are required.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setLoading(true); setError('')

    const { error: err } = await supabase.auth.signUp({
      email,
      password,
    })

    if (err) { setError(err.message); setLoading(false); return }

    // Auto login after signup
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password })
    if (loginErr) {
      setSuccess(true)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #09090B; --s1: #111113; --border: #27272A; --border2: #3F3F46;
          --text: #FAFAFA; --text2: #A1A1AA; --text3: #52525B;
          --red: #EF4444; --red-bg: #450A0A; --red-b: rgba(239,68,68,0.2);
          --green: #22C55E; --green-bg: #052E16; --green-b: rgba(34,197,94,0.2);
        }
        html { -webkit-font-smoothing: antialiased; }
        body { background: var(--bg); color: var(--text); font-family: 'Geist', sans-serif; min-height: 100vh; }

        .page {
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 24px;
        }

        .logo {
          display: flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 600; color: var(--text);
          letter-spacing: -0.02em; margin-bottom: 40px;
        }

        .logo-sq {
          width: 26px; height: 26px; background: var(--text);
          border-radius: 7px; display: flex; align-items: center;
          justify-content: center; font-size: 13px; color: var(--bg); font-weight: 800;
        }

        .card {
          width: 100%; max-width: 380px;
          background: var(--s1); border: 1px solid var(--border);
          border-radius: 14px; padding: 32px;
        }

        .card-title { font-size: 20px; font-weight: 700; letter-spacing: -0.03em; color: var(--text); margin-bottom: 6px; }
        .card-sub { font-size: 13px; color: var(--text3); margin-bottom: 28px; }

        .field { margin-bottom: 12px; }
        .field label { display: block; font-size: 11px; font-weight: 500; color: var(--text3); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 6px; }
        .field input { width: 100%; height: 38px; padding: 0 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-family: 'Geist', sans-serif; font-size: 13px; outline: none; transition: border-color .15s; }
        .field input:focus { border-color: var(--border2); }
        .field input::placeholder { color: var(--text3); }

        .err { font-size: 12px; color: var(--red); padding: 9px 12px; background: var(--red-bg); border: 1px solid var(--red-b); border-radius: 8px; margin-bottom: 14px; display: flex; align-items: center; gap: 7px; }
        .success-box { font-size: 12px; color: var(--green); padding: 9px 12px; background: var(--green-bg); border: 1px solid var(--green-b); border-radius: 8px; margin-bottom: 14px; }

        .btn { width: 100%; height: 40px; background: var(--text); border: none; border-radius: 8px; color: var(--bg); font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: opacity .15s; margin-bottom: 12px; }
        .btn:hover:not(:disabled) { opacity: .85; }
        .btn:disabled { opacity: .4; cursor: not-allowed; }

        .divider { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .divider-line { flex: 1; height: 1px; background: var(--border); }
        .divider-text { font-size: 11px; color: var(--text3); }

        .link-btn { width: 100%; height: 38px; background: transparent; border: 1px solid var(--border); border-radius: 8px; color: var(--text2); font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all .15s; }
        .link-btn:hover { border-color: var(--border2); color: var(--text); }

        .footer-note { text-align: center; margin-top: 24px; font-size: 11px; color: var(--text3); }
      `}</style>

      <div className="page">
        <div className="logo">
          <div className="logo-sq">L</div>
          LeadsFinder
        </div>

        <div className="card">
          <div className="card-title">Create account</div>
          <div className="card-sub">Sign up to start finding leads.</div>

          {success ? (
            <div className="success-box">
              ✓ Account created! Check your email to confirm, then <a href="/login" style={{color:'var(--green)'}}>login here</a>.
            </div>
          ) : (
            <form onSubmit={handleSignup}>
              <div className="field">
                <label>Email</label>
                <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="field" style={{marginBottom: 20}}>
                <label>Confirm Password</label>
                <input type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} />
              </div>

              {error && <div className="err">⚠ {error}</div>}

              <button className="btn" type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account →'}
              </button>

              <div className="divider">
                <div className="divider-line" />
                <span className="divider-text">already have account?</span>
                <div className="divider-line" />
              </div>

              <button className="link-btn" type="button" onClick={() => router.push('/login')}>
                Sign in instead
              </button>
            </form>
          )}
        </div>

        <div className="footer-note">
          Made with ♥ by <strong style={{color:'#A1A1AA'}}>Vibhansh</strong>
        </div>
      </div>
    </>
  )
}
