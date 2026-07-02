'use client'
import { useEffect, useState } from 'react'

const LAUNCH = new Date('2026-02-24T00:01:00+05:30')

export default function Countdown() {
  const [t, setT] = useState({d:0,h:0,m:0,s:0})

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, LAUNCH - new Date())
      setT({
        d: Math.floor(diff/86400000),
        h: Math.floor((diff%86400000)/3600000),
        m: Math.floor((diff%3600000)/60000),
        s: Math.floor((diff%60000)/1000)
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;700;800;900&family=Geist+Mono:wght@500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%}
        body{background:#09090B;color:#FAFAFA;font-family:'Geist',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px}
        .logo{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700;letter-spacing:-0.03em;margin-bottom:48px;justify-content:center}
        .logo-sq{width:28px;height:28px;background:#FAFAFA;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#09090B;font-weight:800}
        .badge{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:#22C55E;background:#052E16;border:1px solid rgba(34,197,94,0.2);padding:5px 14px;border-radius:99px;margin-bottom:24px;letter-spacing:.06em;text-transform:uppercase}
        .dot{width:5px;height:5px;background:#22C55E;border-radius:50%;animation:p 2s ease-in-out infinite}
        @keyframes p{0%,100%{opacity:1}50%{opacity:.3}}
        h1{font-size:clamp(32px,6vw,56px);font-weight:900;letter-spacing:-0.05em;line-height:1.05;margin-bottom:12px}
        .dim{color:#52525B}
        p{font-size:15px;color:#A1A1AA;margin-bottom:48px;line-height:1.7;max-width:380px}
        .cd{display:flex;align-items:flex-start;gap:8px;justify-content:center}
        .cd-block{background:#111113;border:1px solid #27272A;border-radius:12px;padding:16px 18px;min-width:72px}
        .cd-val{font-size:36px;font-weight:800;letter-spacing:-0.04em;font-family:'Geist Mono',monospace;line-height:1;color:#FAFAFA}
        .cd-key{font-size:10px;color:#52525B;letter-spacing:.08em;text-transform:uppercase;margin-top:6px}
        .sep{font-size:28px;font-weight:700;color:#3F3F46;padding-top:14px}
        @media(max-width:400px){.cd-block{min-width:56px;padding:12px 10px}.cd-val{font-size:26px}.cd{gap:5px}}
      `}</style>
      <div className="logo"><div className="logo-sq">LS</div>LandSea</div>
      <div className="badge"><div className="dot"/>Coming Soon</div>
      <h1>Find businesses<br/><span className="dim">without a website.</span></h1>
      <p>LandSea launches 24 Feb 2026. India's smartest lead generation tool for freelancers.</p>
      <div className="cd">
        <div className="cd-block"><div className="cd-val">{String(t.d).padStart(2,'0')}</div><div className="cd-key">Days</div></div>
        <div className="sep">:</div>
        <div className="cd-block"><div className="cd-val">{String(t.h).padStart(2,'0')}</div><div className="cd-key">Hours</div></div>
        <div className="sep">:</div>
        <div className="cd-block"><div className="cd-val">{String(t.m).padStart(2,'0')}</div><div className="cd-key">Mins</div></div>
        <div className="sep">:</div>
        <div className="cd-block"><div className="cd-val">{String(t.s).padStart(2,'0')}</div><div className="cd-key">Secs</div></div>
      </div>
    </>
  )
}
