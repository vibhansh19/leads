'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const LAUNCH = new Date('2025-02-28T15:00:00+05:30')
const INVITE = 'ls_early_xK9mQp2'

export default function LandingPage() {
  const [theme, setTheme] = useState('dark')
  const [timeLeft, setTimeLeft] = useState(null)
  const [status, setStatus] = useState(null) // null=loading, 'locked', 'open'
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('ls_theme') || 'dark'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)

    const params = new URLSearchParams(window.location.search)
    if (params.get('invite') === INVITE) localStorage.setItem('ls_secret', '1')

    const tick = () => {
      const diff = LAUNCH - new Date()
      if (diff <= 0) { setStatus('open'); return }
      if (localStorage.getItem('ls_secret') === '1') { setStatus('open'); return }
      setStatus('locked')
      setTimeLeft({
        d: Math.floor(diff/86400000),
        h: Math.floor((diff%86400000)/3600000),
        m: Math.floor((diff%3600000)/60000),
        s: Math.floor((diff%60000)/1000)
      })
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  const toggleTheme = () => {
    const n = theme === 'dark' ? 'light' : 'dark'
    setTheme(n); localStorage.setItem('ls_theme', n)
    document.documentElement.setAttribute('data-theme', n)
  }

  // Pehle kuch mat dikhao — hydration fix
  if (status === null) return <div style={{background:'#09090B',minHeight:'100vh'}}/>

  if (status === 'locked') return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;700;800;900&family=Geist+Mono:wght@500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%}
        body{background:#09090B;color:#FAFAFA;font-family:'Geist',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px}
        .theme-btn{position:fixed;top:16px;right:16px;width:34px;height:34px;border-radius:8px;border:1px solid #27272A;background:transparent;color:#A1A1AA;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center}
        .logo{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700;letter-spacing:-0.03em;margin-bottom:48px;justify-content:center}
        .logo-sq{width:28px;height:28px;background:#FAFAFA;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#09090B;font-weight:800}
        .badge{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:#22C55E;background:#052E16;border:1px solid rgba(34,197,94,0.2);padding:5px 14px;border-radius:99px;margin-bottom:24px;letter-spacing:.06em;text-transform:uppercase}
        .dot{width:5px;height:5px;background:#22C55E;border-radius:50%;animation:pulse 2s ease-in-out infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        h1{font-size:clamp(32px,6vw,56px);font-weight:900;letter-spacing:-0.05em;line-height:1.05;margin-bottom:12px}
        .dim{color:#52525B}
        p{font-size:15px;color:#A1A1AA;margin-bottom:48px;line-height:1.7;max-width:380px}
        .cd{display:flex;align-items:flex-start;gap:8px;justify-content:center}
        .cd-block{background:#111113;border:1px solid #27272A;border-radius:12px;padding:16px 18px;min-width:70px}
        .cd-val{font-size:34px;font-weight:800;letter-spacing:-0.04em;font-family:'Geist Mono',monospace;line-height:1;color:#FAFAFA}
        .cd-key{font-size:10px;color:#52525B;letter-spacing:.08em;text-transform:uppercase;margin-top:6px}
        .cd-sep{font-size:28px;font-weight:700;color:#3F3F46;padding-top:14px}
        @media(max-width:400px){.cd-block{min-width:56px;padding:12px 10px}.cd-val{font-size:26px}.cd{gap:5px}}
      `}</style>
      <button className="theme-btn" onClick={toggleTheme}>{theme==='dark'?'☀':'☽'}</button>
      <div className="logo"><div className="logo-sq">LS</div>LandSea</div>
      <div className="badge"><div className="dot"/>Coming Soon</div>
      <h1>Find businesses<br/><span className="dim">without a website.</span></h1>
      <p>LandSea launches 28 Feb 2025. India's smartest lead generation tool for freelancers.</p>
      {timeLeft && (
        <div className="cd">
          <div className="cd-block"><div className="cd-val">{String(timeLeft.d).padStart(2,'0')}</div><div className="cd-key">Days</div></div>
          <div className="cd-sep">:</div>
          <div className="cd-block"><div className="cd-val">{String(timeLeft.h).padStart(2,'0')}</div><div className="cd-key">Hours</div></div>
          <div className="cd-sep">:</div>
          <div className="cd-block"><div className="cd-val">{String(timeLeft.m).padStart(2,'0')}</div><div className="cd-key">Mins</div></div>
          <div className="cd-sep">:</div>
          <div className="cd-block"><div className="cd-val">{String(timeLeft.s).padStart(2,'0')}</div><div className="cd-key">Secs</div></div>
        </div>
      )}
    </>
  )

  // OPEN — tera original full page
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root[data-theme="dark"]{--bg:#09090B;--s1:#111113;--s2:#18181B;--border:#27272A;--border2:#3F3F46;--text:#FAFAFA;--text2:#A1A1AA;--text3:#52525B;--green:#22C55E;--green-bg:#052E16;--green-b:rgba(34,197,94,0.2);--red:#EF4444;--card-bg:#111113;--nav-bg:rgba(9,9,11,0.85)}
        :root[data-theme="light"]{--bg:#FAFAF8;--s1:#FFFFFF;--s2:#F4F4F2;--border:#E4E4E7;--border2:#D4D4D8;--text:#09090B;--text2:#52525B;--text3:#A1A1AA;--green:#16A34A;--green-bg:#F0FDF4;--green-b:rgba(22,163,74,0.2);--red:#DC2626;--card-bg:#FFFFFF;--nav-bg:rgba(250,250,248,0.85)}
        html{-webkit-font-smoothing:antialiased;scroll-behavior:smooth}
        body{background:var(--bg);color:var(--text);font-family:'Geist',sans-serif;transition:background .2s,color .2s}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:99px}
        .nav{position:fixed;top:0;left:0;right:0;z-index:100;height:56px;background:var(--nav-bg);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 24px}
        .nav-inner{max-width:1000px;width:100%;margin:0 auto;display:flex;align-items:center;justify-content:space-between}
        .nav-logo{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;color:var(--text);letter-spacing:-0.03em}
        .logo-sq{width:26px;height:26px;background:var(--text);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--bg);font-weight:800;transition:background .2s,color .2s}
        .nav-r{display:flex;align-items:center;gap:8px}
        .theme-btn{width:34px;height:34px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text2);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
        .theme-btn:hover{border-color:var(--border2);color:var(--text)}
        .nav-login{height:34px;padding:0 16px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text2);font-family:'Geist',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s}
        .nav-login:hover{border-color:var(--border2);color:var(--text)}
        .nav-cta{height:34px;padding:0 16px;border-radius:8px;border:none;background:var(--text);color:var(--bg);font-family:'Geist',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:opacity .15s}
        .nav-cta:hover{opacity:.85}
        .hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:100px 24px 80px;position:relative;overflow:hidden}
        .hero-glow{position:absolute;width:600px;height:600px;background:radial-gradient(circle,rgba(34,197,94,0.06) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}
        .hero-badge{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--green);background:var(--green-bg);border:1px solid var(--green-b);padding:5px 14px;border-radius:99px;margin-bottom:28px;letter-spacing:.06em;text-transform:uppercase}
        .hero-badge-dot{width:5px;height:5px;background:var(--green);border-radius:50%;animation:pulse 2s ease-in-out infinite}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
        .hero-title{font-size:clamp(36px,7vw,72px);font-weight:900;letter-spacing:-0.05em;line-height:1;color:var(--text);margin-bottom:20px;max-width:800px}
        .hero-title .dim{color:var(--text3)}
        .hero-sub{font-size:clamp(15px,2vw,18px);color:var(--text2);line-height:1.7;max-width:460px;margin-bottom:40px;font-weight:400}
        .hero-btns{display:flex;align-items:center;gap:10px;justify-content:center;flex-wrap:wrap}
        .btn-primary{height:46px;padding:0 28px;border-radius:10px;border:none;background:var(--text);color:var(--bg);font-family:'Geist',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:opacity .15s;letter-spacing:-0.02em}
        .btn-primary:hover{opacity:.85}
        .btn-secondary{height:46px;padding:0 28px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--text2);font-family:'Geist',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:all .15s}
        .btn-secondary:hover{border-color:var(--border2);color:var(--text)}
        .hero-note{margin-top:16px;font-size:12px;color:var(--text3);display:flex;align-items:center;gap:16px}
        .hero-note-item{display:flex;align-items:center;gap:5px}
        .stats-strip{border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--s1);padding:20px 24px}
        .stats-strip-inner{max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);text-align:center;gap:20px}
        .strip-stat-val{font-size:28px;font-weight:800;letter-spacing:-0.04em;color:var(--text);margin-bottom:4px}
        .strip-stat-lbl{font-size:11px;font-weight:500;color:var(--text3);letter-spacing:.06em;text-transform:uppercase}
        .features{padding:80px 24px;max-width:1000px;margin:0 auto}
        .section-tag{font-size:11px;font-weight:600;color:var(--text3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:16px;display:flex;align-items:center;gap:8px}
        .section-tag::before{content:'';width:16px;height:1px;background:var(--border2)}
        .section-title{font-size:clamp(24px,3.5vw,36px);font-weight:800;letter-spacing:-0.04em;color:var(--text);margin-bottom:12px;line-height:1.1}
        .section-sub{font-size:14px;color:var(--text2);line-height:1.7;max-width:400px;margin-bottom:48px}
        .features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .feat-card{background:var(--card-bg);border:1px solid var(--border);border-radius:12px;padding:22px;transition:border-color .15s}
        .feat-card:hover{border-color:var(--border2)}
        .feat-icon{font-size:20px;margin-bottom:14px;display:block}
        .feat-title{font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px;letter-spacing:-0.01em}
        .feat-desc{font-size:12px;color:var(--text3);line-height:1.65}
        .feat-pro{display:inline-flex;align-items:center;gap:4px;font-size:9px;font-weight:700;color:#EAB308;background:rgba(234,179,8,0.1);border:1px solid rgba(234,179,8,0.2);padding:2px 7px;border-radius:4px;margin-top:10px;letter-spacing:.06em;text-transform:uppercase}
        .pricing{padding:80px 24px;background:var(--s1);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
        .pricing-inner{max-width:640px;margin:0 auto}
        .pricing-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:48px}
        .plan-card{background:var(--bg);border:1px solid var(--border);border-radius:14px;padding:28px;position:relative}
        .plan-card.pro{border-color:var(--border2);background:var(--s2)}
        .plan-badge{position:absolute;top:-10px;left:50%;transform:translateX(-50%);font-size:10px;font-weight:700;color:#EAB308;background:#09090B;border:1px solid rgba(234,179,8,0.3);padding:3px 12px;border-radius:99px;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
        .plan-name{font-size:13px;font-weight:600;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em}
        .plan-price{font-size:36px;font-weight:800;letter-spacing:-0.04em;color:var(--text);margin-bottom:4px;line-height:1}
        .plan-price-sub{font-size:12px;color:var(--text3);margin-bottom:24px}
        .plan-features{display:flex;flex-direction:column;gap:10px;margin-bottom:24px}
        .plan-feat{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text2)}
        .plan-feat-icon{font-size:12px;flex-shrink:0}
        .plan-btn{width:100%;height:38px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text2);font-family:'Geist',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s}
        .plan-btn:hover{border-color:var(--border2);color:var(--text)}
        .plan-btn.pro-btn{background:var(--text);border-color:var(--text);color:var(--bg)}
        .plan-btn.pro-btn:hover{opacity:.85}
        .how{padding:80px 24px;max-width:1000px;margin:0 auto}
        .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;margin-top:48px}
        .step{text-align:center}
        .step-num{width:40px;height:40px;background:var(--s1);border:1px solid var(--border);border-radius:10px;display:flex;align-items:center;justify-content:center;font-family:'Geist Mono',monospace;font-size:13px;font-weight:600;color:var(--text2);margin:0 auto 16px}
        .step-title{font-size:14px;font-weight:600;color:var(--text);margin-bottom:8px;letter-spacing:-0.01em}
        .step-desc{font-size:12px;color:var(--text3);line-height:1.65}
        .cta-section{padding:80px 24px;text-align:center;background:var(--s1);border-top:1px solid var(--border)}
        .cta-title{font-size:clamp(28px,4vw,44px);font-weight:800;letter-spacing:-0.04em;color:var(--text);margin-bottom:16px;line-height:1.1}
        .cta-sub{font-size:14px;color:var(--text2);margin-bottom:32px;line-height:1.7}
        .footer-inner{border-top:1px solid var(--border);padding:20px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;max-width:1000px;margin:0 auto}
        .footer-logo{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--text);letter-spacing:-0.02em}
        .footer-logo-sq{width:20px;height:20px;background:var(--text);border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--bg);font-weight:800}
        .footer-copy{font-size:11px;color:var(--text3)}
        .footer-by{font-size:11px;color:var(--text3)}
        .footer-by strong{color:var(--text2)}
        @media(max-width:700px){.features-grid,.steps{grid-template-columns:1fr}.pricing-grid{grid-template-columns:1fr}.stats-strip-inner{grid-template-columns:1fr;gap:16px}.hero-note{flex-direction:column;gap:8px}.nav-login{display:none}.steps{gap:24px}}
      `}</style>

      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo"><div className="logo-sq">LS</div>LandSea</div>
          <div className="nav-r">
            <button className="theme-btn" onClick={toggleTheme}>{theme==='dark'?'☀':'☽'}</button>
            <button className="nav-login" onClick={()=>router.push('/blog')}>Blog</button>
            <button className="nav-login" onClick={()=>router.push('/login')}>Sign in</button>
            <button className="nav-cta" onClick={()=>router.push('/signup')}>Get Started →</button>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-glow"/>
        <div className="hero-badge"><div className="hero-badge-dot"/>India Business Intelligence</div>
        <h1 className="hero-title">Find businesses<br/><span className="dim">without a website.</span></h1>
        <p className="hero-sub">LandSea scans Google Maps to find local businesses in India with no online presence. Your next clients, delivered instantly.</p>
        <div className="hero-btns">
          <button className="btn-primary" onClick={()=>router.push('/signup')}>Start for Free →</button>
          <button className="btn-secondary" onClick={()=>router.push('/login')}>Sign in</button>
        </div>
        <div className="hero-note">
          <div className="hero-note-item"><span style={{color:'var(--green)'}}>✓</span> Free to start</div>
          <div className="hero-note-item"><span style={{color:'var(--green)'}}>✓</span> No credit card</div>
          <div className="hero-note-item"><span style={{color:'var(--green)'}}>✓</span> India focused</div>
        </div>
      </section>

      <div className="stats-strip">
        <div className="stats-strip-inner">
          <div><div className="strip-stat-val">20+</div><div className="strip-stat-lbl">Business Categories</div></div>
          <div><div className="strip-stat-val">500+</div><div className="strip-stat-lbl">Cities Covered</div></div>
          <div><div className="strip-stat-val">100%</div><div className="strip-stat-lbl">India Focused</div></div>
        </div>
      </div>

      <section className="features">
        <div className="section-tag">Features</div>
        <div className="section-title">Everything you need<br/>to find clients.</div>
        <p className="section-sub">From instant search to lead tracking — LandSea gives you the full picture.</p>
        <div className="features-grid">
          {[
            ['⚡','Instant Search','Search any city and category. Results in seconds from Google Maps.'],
            ['🎯','No Website Filter','Instantly see which businesses have no online presence — your best leads.'],
            ['📊','Lead Status','Track every lead — New, Contacted, Interested, Closed or Rejected.'],
            ['📥','Export CSV & Excel','Download your leads in CSV or Excel format instantly.'],
            ['🔍','Bulk Search','Search multiple cities and categories at once.',true],
            ['📝','Lead Notes','Add personal notes to each lead for better follow-up.',true],
            ['👥','Team Sharing','Share your leads with your team members seamlessly.',true],
            ['🕐','Search History','All your past searches saved. Reload any search in one click.'],
            ['🔒','Secure & Private','Your data is protected. Only you can see your leads.'],
          ].map(([icon,title,desc,pro],i)=>(
            <div key={i} className="feat-card">
              <span className="feat-icon">{icon}</span>
              <div className="feat-title">{title}</div>
              <div className="feat-desc">{desc}</div>
              {pro&&<div className="feat-pro">⚡ Pro</div>}
            </div>
          ))}
        </div>
      </section>

      <section style={{background:'var(--s1)',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
        <div className="how">
          <div className="section-tag">How it works</div>
          <div className="section-title">3 steps to<br/>your next client.</div>
          <div className="steps">
            <div className="step"><div className="step-num">01</div><div className="step-title">Select & Search</div><div className="step-desc">Pick a business category and enter any city in India. LandSea scans Google Maps instantly.</div></div>
            <div className="step"><div className="step-num">02</div><div className="step-title">Find No-Website Leads</div><div className="step-desc">Filter results to see only businesses with no website. These are your highest potential clients.</div></div>
            <div className="step"><div className="step-num">03</div><div className="step-title">Track & Export</div><div className="step-desc">Mark leads as contacted, export to CSV or Excel, and close deals faster.</div></div>
          </div>
        </div>
      </section>

      <section className="pricing">
        <div className="pricing-inner">
          <div className="section-tag">Pricing</div>
          <div className="section-title">Simple pricing.</div>
          <p className="section-sub">Start free. Upgrade when you need more power.</p>
          <div className="pricing-grid">
            <div className="plan-card">
              <div className="plan-name">Free</div><div className="plan-price">₹0</div><div className="plan-price-sub">Forever free</div>
              <div className="plan-features">
                {['5 searches/month','Up to 10 results','Lead status tracking','CSV & Excel export'].map(f=><div key={f} className="plan-feat"><span className="plan-feat-icon" style={{color:'var(--green)'}}>✓</span>{f}</div>)}
                {['Bulk search','Lead notes','Team sharing'].map(f=><div key={f} className="plan-feat"><span className="plan-feat-icon" style={{color:'var(--text3)'}}>✗</span><span style={{color:'var(--text3)'}}>{f}</span></div>)}
              </div>
              <button className="plan-btn" onClick={()=>router.push('/signup')}>Get Started Free</button>
            </div>
            <div className="plan-card pro">
              <div className="plan-badge">Most Popular</div>
              <div className="plan-name">Pro</div><div className="plan-price">Contact</div><div className="plan-price-sub">Request admin for access</div>
              <div className="plan-features">
                {['Unlimited searches','Up to 40 results','Lead status tracking','CSV & Excel export','Bulk search','Lead notes','Team sharing'].map(f=><div key={f} className="plan-feat"><span className="plan-feat-icon" style={{color:'var(--green)'}}>✓</span>{f}</div>)}
              </div>
              <button className="plan-btn pro-btn" onClick={()=>router.push('/dashboard')}>Request Pro Access →</button>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-title">Start finding leads<br/>today. It's free.</div>
        <p className="cta-sub">Join LandSea and discover businesses that need your services.</p>
        <button className="btn-primary" onClick={()=>router.push('/signup')}>Create Free Account →</button>
      </section>

      <footer style={{borderTop:'1px solid var(--border)',padding:'20px 24px'}}>
        <div className="footer-inner">
          <div className="footer-logo"><div className="footer-logo-sq">LS</div>LandSea</div>
          <div className="footer-copy">© 2025 LandSea. All rights reserved.</div>
          <div className="footer-by">Made with ♥ by <strong>Vibhansh</strong></div>
        </div>
      </footer>
    </>
  )
}
