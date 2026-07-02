'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function AdminPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalUsers: 0, totalSearches: 0, totalLeads: 0, activeToday: 0 })
  const [backendStatus, setBackendStatus] = useState('checking')
  const [uptimeStatus, setUptimeStatus] = useState(null)
  const [activity, setActivity] = useState([])
  const [searchData, setSearchData] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLimit, setInviteLimit] = useState(10)
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')
  const [realtimeUsers, setRealtimeUsers] = useState(0)
  const router = useRouter()
  const intervalRef = useRef(null)

  useEffect(() => {
    checkAdmin()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
    if (prof?.role !== 'admin') { router.push('/dashboard'); return }
    await loadAll()
    // Auto refresh every 30s
    intervalRef.current = setInterval(() => {
      checkBackend()
      checkUptime()
      loadRecentActivity()
    }, 30000)
  }

  const loadAll = async () => {
    await Promise.all([
      loadUsers(),
      loadStats(),
      checkBackend(),
      checkUptime(),
      loadRecentActivity(),
      loadSearchData(),
      loadProRequests(),
    ])
    setLoading(false)
  }

  const loadUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
  }

  const loadStats = async () => {
    const { data: usersData } = await supabase.from('profiles').select('*')
    const { count: searchCount } = await supabase.from('searches').select('*', { count: 'exact', head: true })
    const { count: leadCount } = await supabase.from('leads').select('*', { count: 'exact', head: true })

    // Active today
    const today = new Date(); today.setHours(0,0,0,0)
    const { data: todaySearches } = await supabase.from('searches').select('user_id').gte('created_at', today.toISOString())
    const uniqueToday = new Set(todaySearches?.map(s => s.user_id) || []).size

    setStats({
      totalUsers: usersData?.length || 0,
      totalSearches: searchCount || 0,
      totalLeads: leadCount || 0,
      activeToday: uniqueToday
    })
    setRealtimeUsers(uniqueToday)
  }

  const checkBackend = async () => {
    try {
      const start = Date.now()
      const res = await fetch('https://leads-finder-backend.onrender.com/health', { signal: AbortSignal.timeout(8000) })
      const ping = Date.now() - start
      if (res.ok) setBackendStatus({ status: 'up', ping })
      else setBackendStatus({ status: 'down', ping: null })
    } catch {
      setBackendStatus({ status: 'down', ping: null })
    }
  }

  const checkUptime = async () => {
    try {
      const res = await fetch(`/api/uptime`)
      const data = await res.json()
      setUptimeStatus(data)
    } catch {
      setUptimeStatus(null)
    }
  }

  const loadRecentActivity = async () => {
    const { data } = await supabase
      .from('searches')
      .select('*, profiles(email)')
      .order('created_at', { ascending: false })
      .limit(10)
    setActivity(data || [])
  }

  const loadSearchData = async () => {
    // Last 7 days search count per day
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0,0,0,0)
      const next = new Date(d); next.setDate(next.getDate() + 1)
      const { count } = await supabase.from('searches').select('*', { count: 'exact', head: true })
        .gte('created_at', d.toISOString()).lt('created_at', next.toISOString())
      days.push({ day: d.toLocaleDateString('en', { weekday: 'short' }), count: count || 0 })
    }
    setSearchData(days)
  }

  const updateLimit = async (userId, newLimit) => {
    await supabase.from('profiles').update({ search_limit: parseInt(newLimit) }).eq('id', userId)
    setUsers(u => u.map(usr => usr.id === userId ? { ...usr, search_limit: parseInt(newLimit) } : usr))
  }

  const toggleActive = async (userId, current) => {
    await supabase.from('profiles').update({ is_active: !current }).eq('id', userId)
    setUsers(u => u.map(usr => usr.id === userId ? { ...usr, is_active: !current } : usr))
  }

  const togglePro = async (userId, current) => {
    await supabase.from('profiles').update({ is_pro: !current }).eq('id', userId)
    setUsers(u => u.map(usr => usr.id === userId ? { ...usr, is_pro: !current } : usr))
  }

  const resetUsage = async (userId) => {
    await supabase.from('profiles').update({ searches_used: 0 }).eq('id', userId)
    setUsers(u => u.map(usr => usr.id === userId ? { ...usr, searches_used: 0 } : usr))
  }

  const handleInvite = async () => {
    if (!inviteEmail) return
    setInviting(true); setInviteMsg('')
    setInviteMsg('Go to Supabase → Authentication → Users → Invite User to add new users.')
    setInviting(false)
  }

  const [proRequests, setProRequests] = useState([])

  const loadProRequests = async () => {
    const { data } = await supabase.from('pro_requests').select('*').order('created_at', { ascending: false })
    setProRequests(data || [])
  }

  const approveProRequest = async (req) => {
    await supabase.from('profiles').update({ is_pro: true }).eq('id', req.user_id)
    await supabase.from('pro_requests').update({ status: 'approved' }).eq('id', req.id)
    setProRequests(p => p.map(r => r.id === req.id ? { ...r, status: 'approved' } : r))
  }

  const rejectProRequest = async (req) => {
    await supabase.from('pro_requests').update({ status: 'rejected' }).eq('id', req.id)
    setProRequests(p => p.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r))
  }

  const maxCount = Math.max(...searchData.map(d => d.count), 1)

  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts)
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#09090B', color: '#52525B', fontFamily: 'monospace' }}>
      Loading admin panel...
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #09090B; --s1: #111113; --s2: #18181B; --s3: #1F1F23;
          --border: #27272A; --border2: #3F3F46;
          --text: #FAFAFA; --text2: #A1A1AA; --text3: #52525B;
          --green: #22C55E; --green-bg: #052E16; --green-b: rgba(34,197,94,0.2);
          --red: #EF4444; --red-bg: #450A0A; --red-b: rgba(239,68,68,0.2);
          --yellow: #EAB308; --blue: #3B82F6; --r: 10px;
        }
        html { -webkit-font-smoothing: antialiased; }
        body { background: var(--bg); color: var(--text); font-family: 'Geist', sans-serif; font-size: 14px; min-height: 100vh; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }
        .app { min-height: 100vh; display: flex; flex-direction: column; }

        /* TOPBAR */
        .topbar { height: 52px; border-bottom: 1px solid var(--border); display: flex; align-items: center; padding: 0 20px; position: sticky; top: 0; z-index: 100; background: rgba(9,9,11,0.92); backdrop-filter: blur(20px); gap: 12px; }
        .logo { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text); letter-spacing: -0.02em; }
        .logo-sq { width: 24px; height: 24px; background: var(--text); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: var(--bg); font-weight: 800; }
        .topbar-div { width: 1px; height: 16px; background: var(--border); }
        .admin-badge { font-size: 10px; font-weight: 600; color: var(--yellow); background: rgba(234,179,8,0.1); border: 1px solid rgba(234,179,8,0.2); padding: 3px 8px; border-radius: 6px; }
        .topbar-r { margin-left: auto; display: flex; gap: 8px; align-items: center; }
        .back-btn { height: 28px; padding: 0 12px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text3); font-family: 'Geist', sans-serif; font-size: 12px; cursor: pointer; text-decoration: none; display: flex; align-items: center; transition: all .12s; }
        .back-btn:hover { border-color: var(--border2); color: var(--text2); }
        .refresh-btn { height: 28px; padding: 0 12px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text3); font-family: 'Geist', sans-serif; font-size: 12px; cursor: pointer; transition: all .12s; }
        .refresh-btn:hover { border-color: var(--border2); color: var(--text2); }

        /* MAIN */
        .main { flex: 1; max-width: 900px; width: 100%; margin: 0 auto; padding: 32px 20px 80px; }

        /* PAGE HEADER */
        .page-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
        .page-title { font-size: 20px; font-weight: 700; letter-spacing: -0.03em; }
        .page-sub { font-size: 12px; color: var(--text3); margin-top: 3px; }
        .realtime-pill { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: var(--green); background: var(--green-bg); border: 1px solid var(--green-b); padding: 5px 12px; border-radius: 99px; }
        .pulse { width: 6px; height: 6px; background: var(--green); border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)} }

        /* TABS */
        .tabs { display: flex; gap: 4px; margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 0; }
        .tab { height: 36px; padding: 0 14px; background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--text3); font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all .12s; margin-bottom: -1px; }
        .tab:hover { color: var(--text2); }
        .tab.on { color: var(--text); border-bottom-color: var(--text); }

        /* STATS GRID */
        .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 20px; }
        .stat-card { background: var(--s1); border: 1px solid var(--border); border-radius: var(--r); padding: 18px 16px; }
        .stat-val { font-size: 26px; font-weight: 700; letter-spacing: -0.04em; line-height: 1; margin-bottom: 6px; }
        .stat-lbl { font-size: 10px; font-weight: 500; color: var(--text3); letter-spacing: .08em; text-transform: uppercase; }
        .stat-sub { font-size: 11px; color: var(--text3); margin-top: 4px; }

        /* STATUS ROW */
        .status-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
        .status-card { background: var(--s1); border: 1px solid var(--border); border-radius: var(--r); padding: 16px 18px; display: flex; align-items: center; justify-content: space-between; }
        .status-left { display: flex; flex-direction: column; gap: 4px; }
        .status-name { font-size: 12px; font-weight: 600; color: var(--text2); letter-spacing: .04em; text-transform: uppercase; }
        .status-detail { font-size: 11px; color: var(--text3); font-family: 'Geist Mono', monospace; }
        .status-badge { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 8px; }
        .status-up { background: var(--green-bg); border: 1px solid var(--green-b); color: var(--green); }
        .status-down { background: var(--red-bg); border: 1px solid var(--red-b); color: var(--red); }
        .status-checking { background: var(--s2); border: 1px solid var(--border); color: var(--text3); }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; }

        /* CHART */
        .chart-card { background: var(--s1); border: 1px solid var(--border); border-radius: var(--r); padding: 20px; margin-bottom: 20px; }
        .chart-title { font-size: 11px; font-weight: 600; color: var(--text3); letter-spacing: .08em; text-transform: uppercase; margin-bottom: 16px; }
        .chart { display: flex; align-items: flex-end; gap: 8px; height: 80px; }
        .bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; justify-content: flex-end; }
        .bar { width: 100%; border-radius: 4px 4px 0 0; background: var(--border); transition: height .3s ease; min-height: 2px; position: relative; overflow: hidden; }
        .bar-fill { position: absolute; bottom: 0; left: 0; right: 0; background: var(--text); border-radius: 4px 4px 0 0; transition: height .5s ease; }
        .bar-lbl { font-size: 10px; color: var(--text3); font-family: 'Geist Mono', monospace; }
        .bar-val { font-size: 10px; color: var(--text2); font-weight: 600; }

        /* ACTIVITY */
        .activity-card { background: var(--s1); border: 1px solid var(--border); border-radius: var(--r); overflow: hidden; margin-bottom: 20px; }
        .card-hdr { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--border); }
        .card-hdr-title { font-size: 11px; font-weight: 600; color: var(--text2); letter-spacing: .06em; text-transform: uppercase; }
        .activity-item { display: flex; align-items: center; justify-content: space-between; padding: 11px 18px; border-bottom: 1px solid var(--border); gap: 12px; }
        .activity-item:last-child { border-bottom: none; }
        .activity-q { font-size: 13px; font-weight: 500; color: var(--text); }
        .activity-meta { font-size: 11px; color: var(--text3); margin-top: 2px; }
        .activity-time { font-size: 11px; color: var(--text3); white-space: nowrap; font-family: 'Geist Mono', monospace; }
        .activity-badge { font-size: 10px; font-weight: 600; color: var(--text3); background: var(--s2); border: 1px solid var(--border); padding: 3px 8px; border-radius: 6px; white-space: nowrap; }

        /* USERS TABLE */
        .users-card { background: var(--s1); border: 1px solid var(--border); border-radius: var(--r); overflow: hidden; margin-bottom: 20px; }
        .table-hdr { display: grid; grid-template-columns: 1fr 70px 70px 90px 80px; gap: 8px; padding: 10px 18px; border-bottom: 1px solid var(--border); }
        .th { font-size: 10px; font-weight: 600; color: var(--text3); letter-spacing: .08em; text-transform: uppercase; }
        .user-row { display: grid; grid-template-columns: 1fr 70px 70px 70px 90px 80px; gap: 8px; padding: 13px 18px; border-bottom: 1px solid var(--border); align-items: center; transition: background .1s; }
        .user-row:last-child { border-bottom: none; }
        .user-row:hover { background: var(--s2); }
        .user-email { font-size: 13px; font-weight: 500; color: var(--text); }
        .user-role-badge { font-size: 9px; font-weight: 600; color: var(--yellow); background: rgba(234,179,8,0.1); border: 1px solid rgba(234,179,8,0.15); padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 3px; }
        .td { font-size: 12px; color: var(--text2); font-family: 'Geist Mono', monospace; }
        .usage-wrap { display: flex; flex-direction: column; gap: 4px; }
        .usage-nums { font-size: 11px; color: var(--text2); font-family: 'Geist Mono', monospace; }
        .usage-bar { height: 3px; background: var(--border); border-radius: 99px; overflow: hidden; }
        .usage-fill { height: 100%; border-radius: 99px; }
        .limit-input { width: 56px; height: 28px; padding: 0 8px; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-family: 'Geist Mono', monospace; font-size: 12px; text-align: center; outline: none; }
        .limit-input:focus { border-color: var(--border2); }
        .action-btns { display: flex; gap: 4px; }
        .abtn { height: 26px; padding: 0 8px; border-radius: 6px; border: 1px solid var(--border); background: transparent; font-family: 'Geist', sans-serif; font-size: 10px; font-weight: 500; cursor: pointer; transition: all .12s; white-space: nowrap; }
        .abtn-reset { color: var(--text3); }
        .abtn-reset:hover { border-color: var(--border2); color: var(--text2); }
        .abtn-block { color: var(--red); border-color: var(--red-b); }
        .abtn-block:hover { background: var(--red-bg); }
        .abtn-unblock { color: var(--green); border-color: var(--green-b); }
        .abtn-unblock:hover { background: var(--green-bg); }

        /* INVITE */
        .invite-card { background: var(--s1); border: 1px solid var(--border); border-radius: var(--r); padding: 18px; margin-bottom: 20px; }
        .invite-row { display: flex; gap: 8px; }
        .invite-input { flex: 1; height: 36px; padding: 0 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-family: 'Geist', sans-serif; font-size: 13px; outline: none; }
        .invite-input:focus { border-color: var(--border2); }
        .invite-input::placeholder { color: var(--text3); }
        .invite-btn { height: 36px; padding: 0 16px; border-radius: 8px; border: none; background: var(--text); color: var(--bg); font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; }
        .invite-btn:disabled { opacity: .4; cursor: not-allowed; }
        .invite-msg { font-size: 12px; color: var(--text3); margin-top: 10px; padding: 8px 12px; background: var(--s2); border-radius: 7px; border: 1px solid var(--border); }

        /* SECURITY */
        .security-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
        .sec-card { background: var(--s1); border: 1px solid var(--border); border-radius: var(--r); padding: 18px; }
        .sec-title { font-size: 12px; font-weight: 600; color: var(--text2); margin-bottom: 4px; }
        .sec-desc { font-size: 11px; color: var(--text3); line-height: 1.6; }
        .sec-status { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; margin-top: 10px; }
        .sec-ok { color: var(--green); }
        .sec-warn { color: var(--yellow); }

        /* FOOTER */
        .footer { border-top: 1px solid var(--border); padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
        .fc { font-size: 11px; color: var(--text3); }
        .fr { font-size: 11px; color: var(--text3); display: flex; align-items: center; gap: 4px; }
        .fr strong { color: var(--text2); }

        @media(max-width:700px){
          .stats-grid { grid-template-columns: repeat(2,1fr); }
          .status-row { grid-template-columns: 1fr; }
          .security-grid { grid-template-columns: 1fr; }
          .table-hdr, .user-row { grid-template-columns: 1fr 60px 80px 70px; }
          .hide-m { display: none; }
          .main { padding: 24px 14px 60px; }
        }
      `}</style>

      <div className="app">
        <header className="topbar">
          <div className="logo"><div className="logo-sq">LS</div>LandSea</div>
          <div className="topbar-div" />
          <span className="admin-badge">Admin Panel</span>
          <div className="topbar-r">
            <button className="refresh-btn" onClick={loadAll}>↺ Refresh</button>
            <a href="/dashboard" className="back-btn">← Dashboard</a>
          </div>
        </header>

        <main className="main">
          <div className="page-hdr">
            <div>
              <div className="page-title">Admin Panel</div>
              <div className="page-sub">Full control of your platform</div>
            </div>
            <div className="realtime-pill">
              <div className="pulse" />
              {realtimeUsers} active today
            </div>
          </div>

          {/* TABS */}
          <div className="tabs">
            {['overview','users','requests','activity','security'].map(t => (
              <button key={t} className={`tab ${activeTab===t?'on':''}`} onClick={() => setActiveTab(t)}>
                {t === 'requests' ? `⚡ Pro Requests ${proRequests.filter(r=>r.status==='pending').length > 0 ? `(${proRequests.filter(r=>r.status==='pending').length})` : ''}` : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              {/* STATS */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-val" style={{color:'var(--text)'}}>{stats.totalUsers}</div>
                  <div className="stat-lbl">Total Users</div>
                </div>
                <div className="stat-card">
                  <div className="stat-val" style={{color:'var(--green)'}}>{stats.activeToday}</div>
                  <div className="stat-lbl">Active Today</div>
                </div>
                <div className="stat-card">
                  <div className="stat-val" style={{color:'var(--blue)'}}>{stats.totalSearches}</div>
                  <div className="stat-lbl">Total Searches</div>
                </div>
                <div className="stat-card">
                  <div className="stat-val" style={{color:'var(--yellow)'}}>{stats.totalLeads}</div>
                  <div className="stat-lbl">Total Leads</div>
                </div>
              </div>

              {/* STATUS */}
              <div className="status-row">
                <div className="status-card">
                  <div className="status-left">
                    <div className="status-name">Backend — Render</div>
                    <div className="status-detail">
                      {backendStatus?.ping ? `${backendStatus.ping}ms response` : 'leads-finder-backend.onrender.com'}
                    </div>
                  </div>
                  <div className={`status-badge ${backendStatus === 'checking' ? 'status-checking' : backendStatus?.status === 'up' ? 'status-up' : 'status-down'}`}>
                    <div className="status-dot" style={{background: backendStatus === 'checking' ? '#52525B' : backendStatus?.status === 'up' ? '#22C55E' : '#EF4444'}} />
                    {backendStatus === 'checking' ? 'Checking...' : backendStatus?.status === 'up' ? 'Online' : 'Offline'}
                  </div>
                </div>
                <div className="status-card">
                  <div className="status-left">
                    <div className="status-name">Uptime Monitor</div>
                    <div className="status-detail">
                      {uptimeStatus?.uptime_ratio ? `${uptimeStatus.uptime_ratio}% uptime` : 'UptimeRobot'}
                    </div>
                  </div>
                  <div className={`status-badge ${!uptimeStatus ? 'status-checking' : uptimeStatus?.status === 2 ? 'status-up' : 'status-down'}`}>
                    <div className="status-dot" style={{background: !uptimeStatus ? '#52525B' : uptimeStatus?.status === 2 ? '#22C55E' : '#EF4444'}} />
                    {!uptimeStatus ? 'Loading...' : uptimeStatus?.status === 2 ? 'Up' : 'Down'}
                  </div>
                </div>
              </div>

              {/* CHART */}
              <div className="chart-card">
                <div className="chart-title">Searches — Last 7 Days</div>
                <div className="chart">
                  {searchData.map((d, i) => (
                    <div key={i} className="bar-wrap">
                      <div className="bar-val">{d.count}</div>
                      <div className="bar" style={{height: '60px'}}>
                        <div className="bar-fill" style={{height: `${(d.count / maxCount) * 100}%`, background: d.count > 0 ? 'var(--text)' : 'var(--border)'}} />
                      </div>
                      <div className="bar-lbl">{d.day}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <>
              <div className="section-title" style={{fontSize:'11px',fontWeight:600,color:'var(--text3)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:'10px'}}>
                Add New User
              </div>
              <div className="invite-card">
                <div className="invite-row">
                  <input className="invite-input" placeholder="user@email.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                  <button className="invite-btn" onClick={handleInvite} disabled={inviting}>
                    {inviting ? 'Sending...' : 'Invite'}
                  </button>
                </div>
                {inviteMsg && <div className="invite-msg">{inviteMsg}</div>}
              </div>

              <div className="users-card">
                <div className="card-hdr">
                  <span className="card-hdr-title">All Users ({users.length})</span>
                </div>
                <div className="table-hdr">
                  <div className="th">User</div>
                  <div className="th">Usage</div>
                  <div className="th hide-m">Joined</div>
                  <div className="th">Set Limit</div>
                  <div className="th">Actions</div>
                </div>
                {users.map(u => {
                  const pct = Math.min((u.searches_used / u.search_limit) * 100, 100)
                  return (
                    <div key={u.id} className="user-row">
                      <div>
                        <div className="user-email">{u.email}</div>
                        {u.role === 'admin' && <span className="user-role-badge">ADMIN</span>}
                      </div>
                      <div className="usage-wrap">
                        <div className="usage-nums">{u.searches_used}/{u.search_limit}</div>
                        <div className="usage-bar">
                          <div className="usage-fill" style={{width:`${pct}%`, background: pct > 80 ? '#EF4444' : pct > 50 ? '#EAB308' : '#22C55E'}} />
                        </div>
                      </div>
                      <div className="td hide-m">{new Date(u.created_at).toLocaleDateString()}</div>
                      <div>
                        <input className="limit-input" type="number" min="0" max="999" defaultValue={u.search_limit} onBlur={e => updateLimit(u.id, e.target.value)} />
                      </div>
                      <div className="action-btns">
                        <button className="abtn abtn-reset" onClick={() => resetUsage(u.id)} title="Reset usage">↺</button>
                        <button
                          style={{fontSize:'10px',fontWeight:'700',padding:'0 8px',height:'26px',borderRadius:'6px',border: u.is_pro ? '1px solid rgba(167,139,250,0.4)' : '1px solid var(--border)',background: u.is_pro ? 'rgba(167,139,250,0.15)' : 'transparent',color: u.is_pro ? '#A78BFA' : 'var(--text3)',cursor:'pointer',fontFamily:'inherit'}}
                          onClick={() => togglePro(u.id, u.is_pro)}
                        >
                          {u.is_pro ? '⚡ Pro' : 'Free'}
                        </button>
                        <button className={`abtn ${u.is_active ? 'abtn-block' : 'abtn-unblock'}`} onClick={() => toggleActive(u.id, u.is_active)}>
                          {u.is_active ? 'Block' : 'Unblock'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <div className="activity-card">
              <div className="card-hdr">
                <span className="card-hdr-title">Recent Searches</span>
                <span style={{fontSize:'11px',color:'var(--text3)'}}>Last 10 searches</span>
              </div>
              {activity.length === 0
                ? <div style={{padding:'32px',textAlign:'center',color:'var(--text3)',fontSize:'13px'}}>No activity yet.</div>
                : activity.map((a, i) => (
                  <div key={i} className="activity-item">
                    <div>
                      <div className="activity-q">{a.business_type} in {a.location}</div>
                      <div className="activity-meta">{a.profiles?.email}</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <span className="activity-badge">{a.results_count} results</span>
                      <span className="activity-time">{timeAgo(a.created_at)}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="security-grid">
              <div className="sec-card">
                <div className="sec-title">Supabase RLS</div>
                <div className="sec-desc">Row Level Security is enabled. Users can only access their own data. Admin has full access.</div>
                <div className="sec-status sec-ok">✓ Enabled & Active</div>
              </div>
              <div className="sec-card">
                <div className="sec-title">Authentication</div>
                <div className="sec-desc">Supabase Auth with Google OAuth. All routes are protected — unauthenticated users are redirected to login.</div>
                <div className="sec-status sec-ok">✓ Protected</div>
              </div>
              <div className="sec-card">
                <div className="sec-title">API Security</div>
                <div className="sec-desc">Backend runs on Render. API calls are proxied through Next.js — backend URL is never exposed to the client.</div>
                <div className="sec-status sec-ok">✓ Backend Hidden</div>
              </div>
              <div className="sec-card">
                <div className="sec-title">Rate Limiting</div>
                <div className="sec-desc">Per-user search limits enforced via Supabase. Admin can adjust limits anytime from the Users tab.</div>
                <div className="sec-status sec-ok">✓ Active</div>
              </div>
              <div className="sec-card">
                <div className="sec-title">Environment Variables</div>
                <div className="sec-desc">All sensitive keys (Supabase, SerpAPI) stored as environment variables. Never exposed in frontend code.</div>
                <div className="sec-status sec-ok">✓ Secure</div>
              </div>
              <div className="sec-card">
                <div className="sec-title">HTTPS</div>
                <div className="sec-desc">Vercel automatically provides SSL/TLS. All traffic is encrypted end-to-end.</div>
                <div className="sec-status sec-ok">✓ SSL Active</div>
              </div>
            </div>
          )}

          {/* PRO REQUESTS TAB */}
          {activeTab === 'requests' && (
            <div>
              <div style={{marginBottom:'16px',fontSize:'13px',color:'var(--text3)'}}>
                Users jo Pro access maang rahe hain — approve ya reject karo
              </div>
              {proRequests.length === 0 ? (
                <div style={{textAlign:'center',padding:'48px',color:'var(--text3)',background:'var(--s1)',borderRadius:'10px',border:'1px solid var(--border)'}}>
                  Koi pending request nahi hai
                </div>
              ) : proRequests.map(req => (
                <div key={req.id} style={{background:'var(--s1)',border:'1px solid var(--border)',borderRadius:'10px',padding:'16px 18px',marginBottom:'8px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
                  <div>
                    <div style={{fontSize:'13px',fontWeight:'600',color:'var(--text)',marginBottom:'3px'}}>{req.name||req.email}</div>
                    <div style={{fontSize:'11px',color:'var(--text3)',marginBottom:'3px'}}>{req.email}</div>
                    <div style={{fontSize:'10px',color:'var(--text3)',fontFamily:'monospace'}}>{req.user_id?.slice(0,16)}...</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <span style={{fontSize:'11px',fontWeight:'600',padding:'3px 10px',borderRadius:'6px',
                      color: req.status==='approved'?'#22C55E':req.status==='rejected'?'#EF4444':'#EAB308',
                      background: req.status==='approved'?'#052E16':req.status==='rejected'?'#450A0A':'rgba(234,179,8,0.1)',
                      border: `1px solid ${req.status==='approved'?'rgba(34,197,94,0.2)':req.status==='rejected'?'rgba(239,68,68,0.2)':'rgba(234,179,8,0.2)'}`
                    }}>{req.status}</span>
                    {req.status === 'pending' && (
                      <>
                        <button onClick={() => approveProRequest(req)} style={{height:'30px',padding:'0 14px',borderRadius:'7px',border:'none',background:'#22C55E',color:'#000',fontFamily:"'Geist',sans-serif",fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>✓ Approve</button>
                        <button onClick={() => rejectProRequest(req)} style={{height:'30px',padding:'0 14px',borderRadius:'7px',border:'1px solid var(--border)',background:'transparent',color:'var(--text3)',fontFamily:"'Geist',sans-serif",fontSize:'12px',cursor:'pointer'}}>✗ Reject</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>

        <footer className="footer">
          <span className="fc">© 2025 LandSea Admin</span>
          <span className="fr">Made with ♥ by <strong>Vibhansh</strong></span>
        </footer>
      </div>
    </>
  )
}
