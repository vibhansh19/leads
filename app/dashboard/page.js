'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const BUSINESS_TYPES = ['Hotel','Restaurant','School','Hospital','Clinic','Gym','Salon','Pharmacy','Lawyer','CA Accountant','Real Estate Agent','Coaching Center','Dentist','Bakery','Cafe','Mall','Medical Store','Petrol Pump','Travel Agency','Bank']
const STATUS_OPTIONS = [
  {value:'new',label:'New',color:'#52525B',bg:'#18181B'},
  {value:'contacted',label:'Contacted',color:'#60A5FA',bg:'#0C1A2E'},
  {value:'interested',label:'Interested',color:'#EAB308',bg:'#1C1600'},
  {value:'closed',label:'Closed ✓',color:'#22C55E',bg:'#052E16'},
  {value:'rejected',label:'Rejected',color:'#EF4444',bg:'#450A0A'},
]

function exportCSV(leads,bType,loc){
  const h=['#','Name','Phone','Address','Category','Rating','Has Website','Website','Status','Notes','Maps','WhatsApp','AI Pitch']
  const rows=leads.map((l,i)=>[i+1,l.name,l.phone,l.address,l.category,l.rating,l.hasWebsite?'Yes':'No',l.website||'',l.status||'new',l.notes||'',l.url||'',l.phone?`https://wa.me/91${l.phone.replace(/\D/g,'')}`:'',(l.pitch||'')])
  const csv=[h,...rows].map(r=>r.map(c=>`"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n')
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));a.download=`landsea_${bType}_${loc}_${Date.now()}.csv`;a.click()
}
function exportExcel(leads,bType,loc){
  const h=['#','Name','Phone','Address','Category','Rating','Has Website','Website','Status','Notes','Maps']
  const rows=leads.map((l,i)=>[i+1,l.name,l.phone,l.address,l.category,l.rating,l.hasWebsite?'Yes':'No',l.website||'',l.status||'new',l.notes||'',l.url||''])
  const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const xml=`<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Leads"><Table>${[h,...rows].map(r=>`<Row>${r.map(c=>`<Cell><Data ss:Type="String">${esc(c)}</Data></Cell>`).join('')}</Row>`).join('\n')}</Table></Worksheet></Workbook>`
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([xml],{type:'application/vnd.ms-excel'}));a.download=`landsea_${bType}_${loc}_${Date.now()}.xls`;a.click()
}
function timeAgo(ts){const d=Date.now()-new Date(ts);const m=Math.floor(d/60000);if(m<1)return'just now';if(m<60)return`${m}m ago`;const h=Math.floor(m/60);if(h<24)return`${h}h ago`;return`${Math.floor(h/24)}d ago`}
function getWALink(phone){if(!phone)return null;const c=phone.replace(/\D/g,'');return`https://wa.me/${c.startsWith('91')?c:'91'+c}`}
function calcStreak(s){if(!s?.length)return 0;const days=new Set(s.map(x=>new Date(x.created_at).toDateString()));let str=0,d=new Date();while(days.has(d.toDateString())){str++;d.setDate(d.getDate()-1)}return str}

// Lead Score calculation (free — no API needed)
function calcLeadScore(lead){
  let score=5
  if(!lead.hasWebsite) score+=3
  if(lead.phone) score+=1
  if(lead.rating){const r=parseFloat(lead.rating);if(r>=4)score-=1;if(r<3.5)score+=1}
  if(lead.reviews){const r=parseInt(lead.reviews);if(r>100)score-=1;if(r<10)score+=1}
  return Math.min(Math.max(score,1),10)
}
function scoreColor(s){if(s>=8)return'#22C55E';if(s>=5)return'#EAB308';return'#EF4444'}

export default function Dashboard(){
  const [user,setUser]=useState(null)
  const [profile,setProfile]=useState(null)
  const [theme,setTheme]=useState('dark')
  const [businessType,setBusinessType]=useState('')
  const [location,setLocation]=useState('')
  const [maxResults,setMaxResults]=useState(3)
  const [leads,setLeads]=useState([])
  const [loading,setLoading]=useState(false)
  const [loadStep,setLoadStep]=useState(0)
  const [error,setError]=useState('')
  const [summary,setSummary]=useState(null)
  const [filter,setFilter]=useState('all')
  const [history,setHistory]=useState([])
  const [tick,setTick]=useState(0)
  const [currentSearchId,setCurrentSearchId]=useState(null)
  const [authLoading,setAuthLoading]=useState(true)
  const [showProModal,setShowProModal]=useState(false)
  const [expandedNote,setExpandedNote]=useState(null)
  const [expandedPitch,setExpandedPitch]=useState(null)
  const [pitches,setPitches]=useState({})
  const [pitchLoading,setPitchLoading]=useState(null)
  const [allSearches,setAllSearches]=useState([])
  const [totalLeadsFound,setTotalLeadsFound]=useState(0)
  const [streak,setStreak]=useState(0)
  const [referralCopied,setReferralCopied]=useState(false)
  // NEW: Competitor analysis
  const [showCompetitor,setShowCompetitor]=useState(false)
  // NEW: Saved alerts
  const [alerts,setAlerts]=useState([])
  const [showAlertModal,setShowAlertModal]=useState(false)
  const [alertSaved,setAlertSaved]=useState(false)
  const [scraperSource,setScraperSource]=useState('landsea') // 'landsea' or 'api'
  const router=useRouter()

  useEffect(()=>{
    const saved=localStorage.getItem('ls_theme')||'dark'
    setTheme(saved);document.documentElement.setAttribute('data-theme',saved)
  },[])
  const toggleTheme=()=>{const n=theme==='dark'?'light':'dark';setTheme(n);localStorage.setItem('ls_theme',n);document.documentElement.setAttribute('data-theme',n)}
  useEffect(()=>{if(!loading)return;const t=setInterval(()=>setTick(x=>x+1),120);return()=>clearInterval(t)},[loading])
  const sp=['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'][tick%10]

  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(!session){router.push('/login');return}
      setUser(session.user)
      const{data:prof}=await supabase.from('profiles').select('*').eq('id',session.user.id).single()
      setProfile(prof)
      loadHistory(session.user.id)
      loadStats(session.user.id)
      loadAlerts(session.user.id)
      setAuthLoading(false)
    })
  },[])

  const loadHistory=async(uid)=>{const{data}=await supabase.from('searches').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(8);setHistory(data||[])}
  const loadStats=async(uid)=>{const{data:s}=await supabase.from('searches').select('*,results_count').eq('user_id',uid).order('created_at',{ascending:false});setAllSearches(s||[]);setTotalLeadsFound((s||[]).reduce((a,r)=>a+(r.results_count||0),0));setStreak(calcStreak(s||[]))}
  const loadAlerts=async(uid)=>{const{data}=await supabase.from('saved_alerts').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(5);setAlerts(data||[])}

  const isPro=profile?.role==='admin'||profile?.is_pro===true
  const isAdmin=profile?.role==='admin'
  const usagePct=profile?Math.min((profile.searches_used/profile.search_limit)*100,100):0
  const referralLink=user?`${typeof window!=='undefined'?window.location.origin:''}/signup?ref=${user.id.slice(0,8)}`:''

  const copyReferral=()=>{navigator.clipboard.writeText(referralLink);setReferralCopied(true);setTimeout(()=>setReferralCopied(false),2000)}

  const handleSearch=useCallback(async()=>{
    if(!businessType||!location){setError('Select a category and enter a city.');return}
    if(profile&&profile.role!=='admin'&&profile.searches_used>=profile.search_limit){setError(`Limit reached (${profile.search_limit}/month).`);return}
    setError('');setLeads([]);setSummary(null);setLoading(true);setFilter('all');setCurrentSearchId(null)
    setLoadStep(1)
    try{
      setLoadStep(2)
      const res=await fetch('/api/scrape',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({businessType,location,maxResults,userId:user.id,source:scraperSource})})
      const data=await res.json()
      if(data.error)throw new Error(data.error)
      if(!data.leads?.length)throw new Error('No results found. Try a different city or category.')
      setLoadStep(3)
      const{data:searchRow}=await supabase.from('searches').insert({user_id:user.id,business_type:businessType,location,results_count:data.leads.length}).select().single()
      if(searchRow){
        setCurrentSearchId(searchRow.id)
        await supabase.from('leads').insert(data.leads.map(l=>({user_id:user.id,search_id:searchRow.id,name:l.name,phone:l.phone,address:l.address,website:l.website,has_website:l.hasWebsite,rating:l.rating,reviews:l.reviews,category:l.category,maps_url:l.url,status:'new',notes:''})))
        await supabase.from('profiles').update({searches_used:(profile?.searches_used||0)+1}).eq('id',user.id)
        setProfile(p=>({...p,searches_used:(p?.searches_used||0)+1}))
      }
      // Auto-delete 7 din purane leads (free tier save karo)
      const weekAgo=new Date(Date.now()-7*24*60*60*1000).toISOString()
      supabase.from('leads').delete().lt('created_at',weekAgo).then(()=>{})
      setLoadStep(4)
      setLeads(data.leads.map(l=>({...l,status:'new',notes:'',pitch:''})))
      setSummary({total:data.leads.length,hasWebsite:data.leads.filter(l=>l.hasWebsite).length,noWebsite:data.leads.filter(l=>!l.hasWebsite).length})
      loadHistory(user.id);loadStats(user.id)
    }catch(e){setError(e.message)}
    finally{setLoading(false);setLoadStep(0)}
  },[businessType,location,maxResults,profile,user])

  const updateStatus=async(idx,val)=>{
    const old=leads[idx].status||'new';const u=[...leads];u[idx]={...leads[idx],status:val};setLeads(u)
    if(currentSearchId)await supabase.from('leads').update({status:val}).eq('user_id',user.id).eq('search_id',currentSearchId).eq('name',leads[idx].name)
    if(user?.email&&old!==val)fetch('/api/notify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:user.email,leadName:leads[idx].name,oldStatus:old,newStatus:val,businessType,location})}).catch(()=>{})
  }
  const updateNote=async(idx,note)=>{const u=[...leads];u[idx]={...leads[idx],notes:note};setLeads(u);if(currentSearchId)await supabase.from('leads').update({notes:note}).eq('user_id',user.id).eq('search_id',currentSearchId).eq('name',leads[idx].name)}
  const loadFromHistory=async(h)=>{
    setBusinessType(h.business_type);setLocation(h.location)
    const{data:sl}=await supabase.from('leads').select('*').eq('search_id',h.id)
    if(sl?.length){const mapped=sl.map(l=>({name:l.name,phone:l.phone,address:l.address,website:l.website,hasWebsite:l.has_website,rating:l.rating,reviews:l.reviews,category:l.category,url:l.maps_url,status:l.status,notes:l.notes||'',pitch:''}));setLeads(mapped);setCurrentSearchId(h.id);setSummary({total:mapped.length,hasWebsite:mapped.filter(l=>l.hasWebsite).length,noWebsite:mapped.filter(l=>!l.hasWebsite).length});setFilter('all')}
  }

  const generatePitch=async(idx)=>{
    if(pitches[idx]){setExpandedPitch(expandedPitch===idx?null:idx);return}
    setPitchLoading(idx);setExpandedPitch(idx)
    try{
      const l=leads[idx]
      const res=await fetch('/api/pitch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:l.name,category:l.category||businessType,city:location,hasWebsite:l.hasWebsite,phone:l.phone})})
      const data=await res.json()
      setPitches(p=>({...p,[idx]:data.pitch}))
      // Save pitch to lead
      const u=[...leads];u[idx]={...leads[idx],pitch:data.pitch};setLeads(u)
    }catch(e){setPitches(p=>({...p,[idx]:'Could not generate. Try again.'}))}
    setPitchLoading(null)
  }
  const copyPitch=(idx)=>navigator.clipboard.writeText(pitches[idx]||'')

  // Bulk WA Export — Pro only
  const bulkWAExport=()=>{
    if(!isPro){setShowProModal(true);return}
    const noSite=filtered.filter(l=>!l.hasWebsite&&l.phone)
    const lines=noSite.map(l=>`${l.name} — ${getWALink(l.phone)}`).join('\n')
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([lines],{type:'text/plain'}));a.download=`wa_numbers_${Date.now()}.txt`;a.click()
  }

  // Save alert — Pro only
  const saveAlert=async()=>{
    if(!isPro){setShowProModal(true);return}
    if(!businessType||!location){setError('Search pehle karo');return}
    await supabase.from('saved_alerts').insert({user_id:user.id,business_type:businessType,location,created_at:new Date().toISOString()})
    setAlertSaved(true);setTimeout(()=>setAlertSaved(false),2000)
    loadAlerts(user.id)
  }

  const filtered=leads.filter(l=>filter==='nowebsite'?!l.hasWebsite:filter==='haswebsite'?l.hasWebsite:true)
  // Competitor analysis data
  const competitorData={total:filtered.length,online:filtered.filter(l=>l.hasWebsite).length,offline:filtered.filter(l=>!l.hasWebsite).length,avgRating:filtered.length?(filtered.reduce((s,l)=>s+(parseFloat(l.rating)||0),0)/filtered.length).toFixed(1):'—'}

  if(authLoading)return(<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#09090B',color:'#52525B',fontFamily:'monospace',fontSize:'13px'}}>Loading LandSea...</div>)

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root[data-theme="dark"]{--bg:#09090B;--s1:#111113;--s2:#18181B;--border:#27272A;--border2:#3F3F46;--text:#FAFAFA;--text2:#A1A1AA;--text3:#52525B;--green:#22C55E;--green-bg:#052E16;--green-b:rgba(34,197,94,0.15);--red:#EF4444;--red-bg:#1C0A0A;--red-b:rgba(239,68,68,0.2);--yellow:#EAB308;--blue:#60A5FA;--purple:#A78BFA;--nav:rgba(9,9,11,0.88)}
        :root[data-theme="light"]{--bg:#F9F9F7;--s1:#FFFFFF;--s2:#F4F4F2;--border:#E4E4E7;--border2:#D4D4D8;--text:#09090B;--text2:#52525B;--text3:#A1A1AA;--green:#16A34A;--green-bg:#F0FDF4;--green-b:rgba(22,163,74,0.2);--red:#DC2626;--red-bg:#FEF2F2;--red-b:rgba(220,38,38,0.2);--yellow:#CA8A04;--blue:#2563EB;--purple:#7C3AED;--nav:rgba(249,249,247,0.88)}
        html{-webkit-font-smoothing:antialiased}
        body{background:var(--bg);color:var(--text);font-family:'Geist',sans-serif;font-size:14px;min-height:100vh;transition:background .2s,color .2s}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:99px}

        .topbar{height:54px;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 24px;position:sticky;top:0;z-index:100;background:var(--nav);backdrop-filter:blur(24px)}
        .logo{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;color:var(--text);letter-spacing:-0.03em;text-decoration:none}
        .logo-sq{width:26px;height:26px;background:var(--text);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--bg);font-weight:800;transition:background .2s,color .2s;flex-shrink:0}
        .sep{width:1px;height:18px;background:var(--border);margin:0 4px}
        .topbar-pill{font-size:11px;font-weight:500;color:var(--text3);background:var(--s2);border:1px solid var(--border);padding:3px 10px;border-radius:99px}
        .topbar-r{margin-left:auto;display:flex;align-items:center;gap:8px}
        .icon-btn{height:30px;padding:0 10px;border-radius:7px;border:1px solid var(--border);background:transparent;color:var(--text3);font-family:'Geist',sans-serif;font-size:11px;font-weight:500;cursor:pointer;transition:all .12s;display:flex;align-items:center;gap:5px;text-decoration:none;white-space:nowrap}
        .icon-btn:hover{border-color:var(--border2);color:var(--text2)}
        .theme-btn{width:30px;height:30px;border-radius:7px;border:1px solid var(--border);background:transparent;color:var(--text2);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
        .theme-btn:hover{border-color:var(--border2);color:var(--text)}
        .badge-admin{font-size:10px;font-weight:700;color:var(--yellow);background:rgba(234,179,8,0.1);border:1px solid rgba(234,179,8,0.2);padding:3px 8px;border-radius:6px}
        .badge-pro{font-size:10px;font-weight:700;color:var(--purple);background:rgba(167,139,250,0.1);border:1px solid rgba(167,139,250,0.2);padding:3px 8px;border-radius:6px}
        .usage-wrap{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text3)}
        .usage-track{width:48px;height:3px;background:var(--border);border-radius:99px;overflow:hidden}
        .usage-bar{height:100%;border-radius:99px;transition:width .3s}

        .page-wrap{display:grid;grid-template-columns:220px 1fr;min-height:calc(100vh - 54px);max-width:1100px;margin:0 auto;padding:0 24px}
        .sidebar{padding:28px 0;border-right:1px solid var(--border);padding-right:24px}
        .sidebar-section{margin-bottom:28px}
        .sidebar-label{font-size:10px;font-weight:600;color:var(--text3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px;padding-left:10px}

        .stat-mini{background:var(--s1);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:8px}
        .stat-mini-val{font-size:22px;font-weight:700;letter-spacing:-0.04em;color:var(--text);line-height:1;margin-bottom:3px}
        .stat-mini-key{font-size:10px;font-weight:500;color:var(--text3);letter-spacing:.06em;text-transform:uppercase}
        .streak-card{background:linear-gradient(135deg,rgba(234,179,8,0.08),rgba(234,179,8,0.02));border:1px solid rgba(234,179,8,0.2);border-radius:10px;padding:14px;margin-bottom:8px}
        .streak-val{font-size:22px;font-weight:700;letter-spacing:-0.04em;color:var(--yellow);line-height:1;margin-bottom:3px}
        .streak-key{font-size:10px;font-weight:500;color:var(--text3);letter-spacing:.06em;text-transform:uppercase}

        .referral-card{background:linear-gradient(135deg,rgba(167,139,250,0.08),rgba(167,139,250,0.02));border:1px solid rgba(167,139,250,0.2);border-radius:10px;padding:14px}
        .referral-title{font-size:12px;font-weight:600;color:var(--purple);margin-bottom:4px}
        .referral-sub{font-size:11px;color:var(--text3);line-height:1.5;margin-bottom:10px}
        .referral-btn{width:100%;height:30px;border-radius:7px;border:1px solid rgba(167,139,250,0.3);background:rgba(167,139,250,0.1);color:var(--purple);font-family:'Geist',sans-serif;font-size:11px;font-weight:600;cursor:pointer}
        .referral-link-box{background:var(--bg);border:1px solid var(--border);border-radius:7px;padding:8px 10px;font-size:10px;color:var(--text3);font-family:'Geist Mono',monospace;word-break:break-all;margin-top:8px;line-height:1.5}

        .hist-item{padding:9px 10px;border-radius:8px;cursor:pointer;transition:background .1s;margin-bottom:2px}
        .hist-item:hover{background:var(--s2)}
        .hist-name{font-size:12px;font-weight:500;color:var(--text);line-height:1.3}
        .hist-meta{font-size:10px;color:var(--text3);margin-top:2px}

        /* ALERTS */
        .alert-item{padding:9px 10px;border-radius:8px;border:1px solid var(--border);margin-bottom:6px;display:flex;align-items:center;justify-content:space-between}
        .alert-name{font-size:11px;font-weight:500;color:var(--text)}
        .alert-loc{font-size:10px;color:var(--text3)}

        .main-content{padding:28px 0 28px 28px;min-width:0}
        .search-card{background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px}
        .search-card-title{font-size:11px;font-weight:600;color:var(--text3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
        .field-label{font-size:11px;font-weight:500;color:var(--text3);letter-spacing:.05em;text-transform:uppercase;margin-bottom:5px;display:block}
        .field-wrap{position:relative}
        .field-wrap select,.field-wrap input{width:100%;height:38px;padding:0 30px 0 12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:'Geist',sans-serif;font-size:13px;outline:none;appearance:none;-webkit-appearance:none;transition:border-color .15s}
        .field-wrap input{padding-right:12px}
        .field-wrap select:focus,.field-wrap input:focus{border-color:var(--border2)}
        .field-wrap input::placeholder{color:var(--text3)}
        .select-arr{position:absolute;right:10px;top:50%;transform:translateY(-50%);color:var(--text3);font-size:9px;pointer-events:none}
        .count-row{display:flex;align-items:center;gap:6px;margin-bottom:14px;flex-wrap:wrap}
        .count-lbl{font-size:11px;font-weight:500;color:var(--text3);letter-spacing:.05em;text-transform:uppercase;margin-right:6px}
        .count-btn{height:38px;padding:0 14px;min-width:38px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text2);font-size:13px;font-weight:500;font-family:'Geist',sans-serif;cursor:pointer;transition:all .12s;display:flex;align-items:center;justify-content:center}
        .count-btn:hover{border-color:var(--border2);color:var(--text)}
        .count-btn.on{background:var(--text);border-color:var(--text);color:var(--bg);font-weight:700}
        .err-box{font-size:12px;color:var(--red);padding:10px 12px;background:var(--red-bg);border:1px solid var(--red-b);border-radius:8px;margin-bottom:12px;display:flex;align-items:center;gap:7px}
        .search-btn{width:100%;height:40px;background:var(--text);border:none;border-radius:9px;color:var(--bg);font-family:'Geist',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:opacity .15s;display:flex;align-items:center;justify-content:center;gap:8px}
        .search-btn:hover:not(:disabled){opacity:.85}
        .search-btn:disabled{opacity:.3;cursor:not-allowed}
        .mono{font-family:'Geist Mono',monospace}

        .pro-lock{background:var(--s1);border:1px dashed var(--border);border-radius:12px;padding:24px 20px;margin-bottom:16px;text-align:center;cursor:pointer;transition:border-color .15s}
        .pro-lock:hover{border-color:rgba(167,139,250,0.4)}
        .pro-lock-ico{font-size:20px;opacity:.3;margin-bottom:8px}
        .pro-lock-title{font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px}
        .pro-lock-sub{font-size:11px;color:var(--text3);margin-bottom:12px}
        .pro-lock-btn{height:30px;padding:0 16px;border-radius:7px;border:1px solid rgba(167,139,250,0.3);background:rgba(167,139,250,0.08);color:var(--purple);font-family:'Geist',sans-serif;font-size:11px;font-weight:600;cursor:pointer}

        .load-box{background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:12px}
        .load-steps{display:flex;flex-direction:column;gap:10px}
        .load-step{display:flex;align-items:center;gap:10px;font-size:13px}
        .load-step-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;background:var(--border2)}
        .load-step.done .load-step-dot{background:var(--green)}
        .load-step.active .load-step-dot{background:var(--yellow);animation:pulse2 1s ease-in-out infinite}
        .load-step.done span{color:var(--text2)}
        .load-step.active span{color:var(--text);font-weight:500}
        .load-step.wait span{color:var(--text3)}
        @keyframes pulse2{0%,100%{opacity:1}50%{opacity:.3}}
        .skel{background:var(--s1);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:12px}
        .skel-item{padding:16px 18px;border-bottom:1px solid var(--border)}
        .skel-item:last-child{border-bottom:none}
        .skel-line{height:12px;border-radius:6px;background:var(--s2);margin-bottom:8px;animation:shimmer 1.5s ease-in-out infinite}
        .skel-line.w80{width:80%}.skel-line.w60{width:60%}.skel-line.w40{width:40%}
        @keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}

        /* COMPETITOR ANALYSIS */
        .comp-card{background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px}
        .comp-title{font-size:11px;font-weight:600;color:var(--text3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:16px}
        .comp-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        .comp-stat{text-align:center;padding:12px;background:var(--s2);border-radius:8px}
        .comp-val{font-size:22px;font-weight:700;letter-spacing:-0.03em;margin-bottom:2px}
        .comp-key{font-size:10px;color:var(--text3);letter-spacing:.06em;text-transform:uppercase}
        .comp-bar-wrap{margin-top:14px}
        .comp-bar-label{display:flex;justify-content:space-between;font-size:11px;color:var(--text3);margin-bottom:6px}
        .comp-bar-track{height:8px;background:var(--border);border-radius:99px;overflow:hidden}
        .comp-bar-fill{height:100%;background:var(--green);border-radius:99px;transition:width .5s}

        .stats-strip{display:grid;grid-template-columns:repeat(3,1fr);background:var(--s1);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:12px}
        .stat-cell{padding:16px;text-align:center;border-right:1px solid var(--border)}
        .stat-cell:last-child{border-right:none}
        .stat-num{font-size:26px;font-weight:700;letter-spacing:-0.04em;line-height:1;margin-bottom:4px}
        .stat-lbl{font-size:10px;font-weight:500;color:var(--text3);letter-spacing:.08em;text-transform:uppercase}

        .toolbar{display:flex;align-items:center;gap:6px;margin-bottom:12px;flex-wrap:wrap}
        .flt-btn{height:30px;padding:0 12px;border-radius:7px;border:1px solid var(--border);background:transparent;color:var(--text3);font-family:'Geist',sans-serif;font-size:12px;font-weight:500;cursor:pointer;transition:all .12s}
        .flt-btn:hover{border-color:var(--border2);color:var(--text2)}
        .flt-btn.on{background:var(--s2);border-color:var(--border2);color:var(--text)}
        .exp-grp{margin-left:auto;display:flex;gap:6px}
        .exp-btn{height:30px;padding:0 12px;border-radius:7px;font-family:'Geist',sans-serif;font-size:12px;font-weight:600;cursor:pointer;border:1px solid;transition:opacity .12s}
        .exp-csv{background:var(--green-bg);border-color:var(--green-b);color:var(--green)}
        .exp-xls{background:rgba(96,165,250,0.05);border-color:rgba(96,165,250,0.2);color:var(--blue)}
        .exp-wa{background:rgba(37,211,102,0.05);border-color:rgba(37,211,102,0.2);color:#25D366}
        .exp-btn:hover{opacity:.7}

        .results{background:var(--s1);border:1px solid var(--border);border-radius:12px;overflow:hidden}
        .result-item{padding:16px 18px;border-bottom:1px solid var(--border);transition:background .1s}
        .result-item:last-child{border-bottom:none}
        .result-item:hover{background:var(--s2)}
        .result-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:start}
        .r-idx{font-family:'Geist Mono',monospace;font-size:10px;color:var(--text3);margin-bottom:4px}
        .r-name{font-size:14px;font-weight:600;color:var(--text);letter-spacing:-0.02em;margin-bottom:2px}
        .r-cat{font-size:11px;color:var(--text3);margin-bottom:5px}
        .r-rating{font-size:11px;color:var(--yellow);font-weight:500;margin-bottom:6px}
        .r-details{display:flex;flex-direction:column;gap:3px;margin-bottom:10px}
        .r-row{display:flex;align-items:flex-start;gap:7px;font-size:12px;color:var(--text3);line-height:1.5}
        .r-ico{opacity:.4;flex-shrink:0;font-style:normal;font-size:11px;margin-top:1px}
        .r-row a{color:var(--blue);text-decoration:none}
        .r-row a:hover{text-decoration:underline}
        .r-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
        .maps-btn{display:inline-flex;align-items:center;gap:4px;height:26px;padding:0 10px;border-radius:6px;border:1px solid var(--border);background:transparent;font-family:'Geist',sans-serif;font-size:11px;font-weight:500;color:var(--text3);cursor:pointer;text-decoration:none;transition:all .12s}
        .maps-btn:hover{border-color:var(--border2);color:var(--text2)}
        .wa-btn{display:inline-flex;align-items:center;gap:4px;height:26px;padding:0 10px;border-radius:6px;border:1px solid rgba(37,211,102,0.3);background:rgba(37,211,102,0.06);font-family:'Geist',sans-serif;font-size:11px;font-weight:500;color:#25D366;cursor:pointer;text-decoration:none;transition:all .12s}
        .wa-btn:hover{background:rgba(37,211,102,0.12)}
        .r-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px}
        .site-badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;white-space:nowrap}
        .badge-yes{background:var(--green-bg);border:1px solid var(--green-b);color:var(--green)}
        .badge-no{background:var(--red-bg);border:1px solid var(--red-b);color:var(--red)}
        .status-sel{height:28px;padding:0 8px;border-radius:6px;border:1px solid var(--border);background:var(--bg);color:var(--text2);font-family:'Geist',sans-serif;font-size:11px;font-weight:500;cursor:pointer;outline:none;appearance:none;-webkit-appearance:none;min-width:108px}

        /* LEAD SCORE */
        .score-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;border:1px solid}

        .note-tog{display:inline-flex;align-items:center;gap:5px;margin-top:6px;font-size:11px;color:var(--text3);cursor:pointer;border:none;background:transparent;font-family:'Geist',sans-serif;transition:color .12s;padding:0}
        .note-tog:hover{color:var(--text2)}
        .note-area{width:100%;margin-top:8px;padding:9px 11px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:'Geist',sans-serif;font-size:12px;resize:vertical;min-height:64px;outline:none;transition:border-color .15s;line-height:1.6}
        .note-area:focus{border-color:var(--border2)}
        .note-area::placeholder{color:var(--text3)}
        .pitch-tog{display:inline-flex;align-items:center;gap:5px;margin-top:6px;font-size:11px;color:var(--purple);cursor:pointer;border:none;background:transparent;font-family:'Geist',sans-serif;padding:0;transition:opacity .12s}
        .pitch-tog:hover{opacity:.7}
        .pitch-box{margin-top:8px;background:rgba(167,139,250,0.05);border:1px solid rgba(167,139,250,0.2);border-radius:8px;overflow:hidden}
        .pitch-hdr{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid rgba(167,139,250,0.15)}
        .pitch-lbl{font-size:10px;font-weight:600;color:var(--purple);letter-spacing:.06em;text-transform:uppercase}
        .pitch-copy{height:24px;padding:0 10px;border-radius:5px;border:1px solid rgba(167,139,250,0.3);background:transparent;color:var(--purple);font-family:'Geist',sans-serif;font-size:10px;font-weight:600;cursor:pointer}
        .pitch-text{padding:12px;font-size:12px;color:var(--text2);line-height:1.7;white-space:pre-wrap}
        .pitch-loading{padding:20px;text-align:center;font-size:12px;color:var(--text3)}

        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(6px)}
        .modal{background:var(--s1);border:1px solid var(--border);border-radius:16px;padding:32px;max-width:360px;width:100%;text-align:center}
        .modal-ico{font-size:32px;margin-bottom:16px}
        .modal-title{font-size:18px;font-weight:700;letter-spacing:-0.03em;margin-bottom:8px;color:var(--text)}
        .modal-sub{font-size:13px;color:var(--text3);margin-bottom:24px;line-height:1.65}
        .modal-ok{width:100%;height:40px;border-radius:9px;border:1px solid var(--border);background:transparent;color:var(--text2);font-family:'Geist',sans-serif;font-size:13px;cursor:pointer}

        .empty{padding:48px;text-align:center;color:var(--text3);font-size:13px}
        .page-footer{border-top:1px solid var(--border);padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
        .ft{font-size:11px;color:var(--text3)}
        .ft strong{color:var(--text2);font-weight:600}

        @media(max-width:860px){
          .page-wrap{grid-template-columns:1fr;padding:0}
          .sidebar{display:block;border-right:none;padding:0 16px 0}
          .main-content{padding:16px 16px 24px}
          /* Hide heavy sidebar sections on mobile */
          .sidebar .referral-card{display:none}
          .sidebar-section:last-child{display:none}
          /* Stats row */
          .your-stats-sec{padding:12px 0 0}
          .your-stats-sec .sidebar-label{display:none}
          .mobile-stats{display:flex!important;gap:8px;overflow-x:auto;padding-bottom:12px;border-bottom:1px solid var(--border);margin-bottom:0;scrollbar-width:none}
          .mobile-stats::-webkit-scrollbar{display:none}
          /* Explore row */
          .sidebar-section.explore-sec{padding:10px 0;border-bottom:1px solid var(--border);margin-bottom:0}
          .sidebar-section.explore-sec .sidebar-label{display:none}
          .explore-row{display:flex!important;gap:8px}
          .explore-row a{flex:1;text-align:center;padding:8px!important}
          /* Hide desktop stat cards */
          .sidebar .streak-card,.sidebar .stat-mini{display:none}
          /* Show mobile rows */
          .mobile-stats{display:flex!important;gap:8px;overflow-x:auto;padding-bottom:10px;scrollbar-width:none}
          .mobile-stats::-webkit-scrollbar{display:none}
          .explore-row{display:flex!important;gap:8px}
        }
        @media(max-width:520px){
          .grid2{grid-template-columns:1fr}
          .topbar{padding:0 14px}
          .usage-wrap,.topbar-pill{display:none}
          .stat-num{font-size:20px}
          .exp-grp{margin-left:0;width:100%;justify-content:flex-start}
          .toolbar{gap:4px}
          .comp-grid{grid-template-columns:repeat(2,1fr)}
          .count-row{gap:4px}
          .count-btn{height:34px;padding:0 10px;font-size:12px}
        }
      `}</style>

      {showProModal&&(<div className="modal-overlay" onClick={()=>setShowProModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-ico">⚡</div><div className="modal-title">Upgrade to Pro</div><div className="modal-sub">Send a Pro request to admin. You'll get access within 24 hours.</div><button style={{width:'100%',height:'40px',borderRadius:'9px',border:'none',background:'var(--text)',color:'var(--bg)',fontFamily:"'Geist',sans-serif",fontSize:'13px',fontWeight:'700',cursor:'pointer',marginBottom:'8px'}} onClick={async()=>{await fetch('/api/pro-request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:user.id,email:user.email,name:user.user_metadata?.full_name||user.email})});setShowProModal(false);alert('Request sent! Admin will review within 24 hours.')}}>Request Pro Access ⚡</button><button className="modal-ok" onClick={()=>setShowProModal(false)}>Maybe later</button></div></div>)}

      <header className="topbar">
        <a href="/" className="logo"><div className="logo-sq">LS</div>LandSea</a>
        <div className="sep"/>
        <span className="topbar-pill">India · Business Intel</span>
        <div className="topbar-r">
          <button className="theme-btn" onClick={toggleTheme}>{theme==='dark'?'☀':'☽'}</button>
          {isAdmin&&<a href="/admin" className="icon-btn">⚡ Admin</a>}
          {isAdmin&&<span className="badge-admin">Admin</span>}
          {isPro&&!isAdmin&&<span className="badge-pro">Pro</span>}
          {profile&&!isAdmin&&(<div className="usage-wrap"><span>{profile.searches_used}/{profile.search_limit}</span><div className="usage-track"><div className="usage-bar" style={{width:`${usagePct}%`,background:usagePct>80?'var(--red)':usagePct>50?'var(--yellow)':'var(--green)'}}/></div></div>)}
          <button className="icon-btn" onClick={async()=>{await supabase.auth.signOut();router.push('/login')}}>Sign out</button>
        </div>
      </header>

      <div className="page-wrap">
        <aside className="sidebar">
          {/* Mobile Stats + Nav Row */}
          <div style={{padding:'12px 0 0'}}>
            <div className="mobile-stats" style={{display:'none'}}>
              <div style={{minWidth:'80px',background:'linear-gradient(135deg,rgba(234,179,8,0.08),rgba(234,179,8,0.02))',border:'1px solid rgba(234,179,8,0.2)',borderRadius:'10px',padding:'10px 12px',flexShrink:0}}>
                <div style={{fontSize:'18px',fontWeight:'700',color:'#EAB308',letterSpacing:'-0.03em'}}>🔥 {streak}</div>
                <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'.06em',textTransform:'uppercase',marginTop:'3px'}}>Streak</div>
              </div>
              <div style={{minWidth:'80px',background:'var(--s1)',border:'1px solid var(--border)',borderRadius:'10px',padding:'10px 12px',flexShrink:0}}>
                <div style={{fontSize:'18px',fontWeight:'700',color:'var(--blue)',letterSpacing:'-0.03em'}}>{allSearches.length}</div>
                <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'.06em',textTransform:'uppercase',marginTop:'3px'}}>Searches</div>
              </div>
              <div style={{minWidth:'80px',background:'var(--s1)',border:'1px solid var(--border)',borderRadius:'10px',padding:'10px 12px',flexShrink:0}}>
                <div style={{fontSize:'18px',fontWeight:'700',color:'var(--green)',letterSpacing:'-0.03em'}}>{totalLeadsFound}</div>
                <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'.06em',textTransform:'uppercase',marginTop:'3px'}}>Leads</div>
              </div>
            </div>

          </div>

          {/* Desktop sidebar sections */}
          <div className="sidebar-section your-stats-sec">
            <div className="sidebar-label">Your Stats</div>
            <div className="streak-card"><div className="streak-val">🔥 {streak}</div><div className="streak-key">Day Streak</div></div>
            <div className="stat-mini"><div className="stat-mini-val" style={{color:'var(--blue)'}}>{allSearches.length}</div><div className="stat-mini-key">Total Searches</div></div>
            <div className="stat-mini"><div className="stat-mini-val" style={{color:'var(--green)'}}>{totalLeadsFound}</div><div className="stat-mini-key">Total Leads Found</div></div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">Explore</div>
            <a href="/leaderboard" className="hist-item" style={{display:'block',textDecoration:'none',padding:'9px 10px',borderRadius:'8px',marginBottom:'2px',background:'var(--s2)',border:'1px solid var(--border)'}}>
              <div className="hist-name" style={{color:'var(--text)'}}>🏆 Leaderboard</div>
              <div className="hist-meta">See top lead hunters</div>
            </a>
            <a href="/blog" className="hist-item" style={{display:'block',textDecoration:'none',padding:'9px 10px',borderRadius:'8px',background:'var(--s2)',border:'1px solid var(--border)'}}>
              <div className="hist-name" style={{color:'var(--text)'}}>📝 Blog</div>
              <div className="hist-meta">Tips & guides</div>
            </a>
          </div>

          {isPro&&alerts.length>0&&(
            <div className="sidebar-section">
              <div className="sidebar-label">Saved Alerts</div>
              {alerts.map((a,i)=>(
                <div key={i} className="alert-item">
                  <div><div className="alert-name">{a.business_type}</div><div className="alert-loc">{a.location}</div></div>
                  <span style={{fontSize:'10px',color:'var(--text3)'}}>🔔</span>
                </div>
              ))}
            </div>
          )}

          <div className="sidebar-section" id="recent-searches">
            <div className="sidebar-label">Recent Searches</div>
            {history.length===0?<div style={{fontSize:'11px',color:'var(--text3)',paddingLeft:'10px'}}>No searches yet</div>
              :history.map((h,i)=>(<div key={i} className="hist-item" onClick={()=>loadFromHistory(h)}><div className="hist-name">{h.business_type} in {h.location}</div><div className="hist-meta">{h.results_count} results · {timeAgo(h.created_at)}</div></div>))}
          </div>
        </aside>

        <main className="main-content">
          <div className="search-card">
            <div className="search-card-title">New Search</div>
            <div className="grid2">
              <div><label className="field-label">Category</label><div className="field-wrap"><select value={businessType} onChange={e=>setBusinessType(e.target.value)}><option value="">Select type...</option>{BUSINESS_TYPES.map(b=><option key={b}>{b}</option>)}</select><span className="select-arr">▾</span></div></div>
              <div><label className="field-label">City</label><div className="field-wrap"><input placeholder="e.g. Jaipur" value={location} onChange={e=>setLocation(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()}/></div></div>
            </div>
            <div className="count-row">
              <span className="count-lbl">Results</span>
              {[1,2,3,4,5,10].map(n=>(<button key={n} className={`count-btn ${maxResults===n?'on':''}`} onClick={()=>setMaxResults(n)}>{n}</button>))}
              {isPro?[20,40].map(n=>(<button key={n} className={`count-btn ${maxResults===n?'on':''}`} onClick={()=>setMaxResults(n)}>{n}</button>))
                :[20,40].map(n=>(<button key={n} className="count-btn" style={{opacity:.35,cursor:'not-allowed',fontSize:'11px'}} onClick={()=>setShowProModal(true)}>{n} 🔒</button>))}
            </div>
            {isPro&&(
              <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
                <button onClick={()=>setScraperSource('landsea')} style={{flex:1,height:'38px',borderRadius:'8px',border:`1px solid ${scraperSource==='landsea'?'var(--green)':'var(--border)'}`,background:scraperSource==='landsea'?'var(--green-bg)':'transparent',color:scraperSource==='landsea'?'var(--green)':'var(--text3)',fontFamily:"'Geist',sans-serif",fontSize:'12px',fontWeight:'600',cursor:'pointer',transition:'all .15s'}}>
                  🎯 LandSea<br/><span style={{fontSize:'10px',fontWeight:'400',opacity:.7}}>Accurate · Slower</span>
                </button>
                <button onClick={()=>setScraperSource('api')} style={{flex:1,height:'38px',borderRadius:'8px',border:`1px solid ${scraperSource==='api'?'var(--blue)':'var(--border)'}`,background:scraperSource==='api'?'rgba(96,165,250,0.08)':'transparent',color:scraperSource==='api'?'var(--blue)':'var(--text3)',fontFamily:"'Geist',sans-serif",fontSize:'12px',fontWeight:'600',cursor:'pointer',transition:'all .15s'}}>
                  ⚡ SerpAPI<br/><span style={{fontSize:'10px',fontWeight:'400',opacity:.7}}>Fast · Real-time</span>
                </button>
              </div>
            )}
            {error&&<div className="err-box">⚠ {error}</div>}
            <button className="search-btn" onClick={handleSearch} disabled={loading}>
              {loading?<><span className="mono">{sp}</span>&nbsp;Scanning...</>:'Search Leads →'}
            </button>
          </div>

          {!isPro&&(<div className="pro-lock" onClick={()=>setShowProModal(true)}><div className="pro-lock-ico">🔍</div><div className="pro-lock-title">Bulk Search</div><div className="pro-lock-sub">Search multiple cities at once</div><button className="pro-lock-btn">Unlock Pro ⚡</button></div>)}

          {loading&&(
            <div className="load-box">
              <div className="load-steps">
                <div className={`load-step ${loadStep>=1?'done':'wait'}`}><div className="load-step-dot"/><span>Connecting to search engine</span></div>
                <div className={`load-step ${loadStep>=2?'active':loadStep>=3?'done':'wait'} ${loadStep===2?'active':loadStep>2?'done':''}`}><div className="load-step-dot"/><span>Scanning Google Maps for {businessType} in {location}...</span></div>
                <div className={`load-step ${loadStep>=3?'done':loadStep===2?'active':'wait'}`}><div className="load-step-dot"/><span>Extracting contact details</span></div>
                <div className={`load-step ${loadStep>=4?'done':'wait'}`}><div className="load-step-dot"/><span>Saving results</span></div>
              </div>
            </div>
          )}
          {loading&&(
            <div className="skel">
              {[1,2,3].map(i=>(<div key={i} className="skel-item"><div className="skel-line w80"/><div className="skel-line w60"/><div className="skel-line w40"/></div>))}
            </div>
          )}

          {!loading&&!summary&&leads.length===0&&(
            <div style={{background:'var(--s1)',border:'1px dashed var(--border)',borderRadius:'12px',padding:'40px 24px',textAlign:'center',marginBottom:'16px'}}>
              <div style={{fontSize:'32px',marginBottom:'16px'}}>🔍</div>
              <div style={{fontSize:'16px',fontWeight:'700',letterSpacing:'-0.03em',marginBottom:'8px',color:'var(--text)'}}>Find your first lead</div>
              <div style={{fontSize:'13px',color:'var(--text3)',marginBottom:'24px',lineHeight:'1.7',maxWidth:'320px',margin:'0 auto 24px'}}>Select a business category, enter any Indian city, and LandSea will scan Google Maps for businesses without a website.</div>
              <div style={{display:'flex',justifyContent:'center',gap:'16px',flexWrap:'wrap'}}>
                {['Restaurant in Jaipur','Clinic in Indore','Salon in Surat'].map(s=>(
                  <button key={s} onClick={()=>{const[b,l]=s.split(' in ');setBusinessType(b);setLocation(l)}} style={{height:'32px',padding:'0 14px',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--s2)',color:'var(--text2)',fontFamily:"'Geist',sans-serif",fontSize:'12px',cursor:'pointer'}}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {summary&&!loading&&(
            <>
              <div className="stats-strip">
                <div className="stat-cell"><div className="stat-num" style={{color:'var(--text)'}}>{summary.total}</div><div className="stat-lbl">Found</div></div>
                <div className="stat-cell"><div className="stat-num" style={{color:'var(--green)'}}>{summary.hasWebsite}</div><div className="stat-lbl">Online</div></div>
                <div className="stat-cell"><div className="stat-num" style={{color:'var(--red)'}}>{summary.noWebsite}</div><div className="stat-lbl">No Website</div></div>
              </div>

              {/* COMPETITOR ANALYSIS — PRO */}
              {isPro?(
                <div className="comp-card">
                  <div className="comp-title">📊 Competitor Analysis — {businessType} in {location}</div>
                  <div className="comp-grid">
                    <div className="comp-stat"><div className="comp-val" style={{color:'var(--text)'}}>{competitorData.total}</div><div className="comp-key">Total</div></div>
                    <div className="comp-stat"><div className="comp-val" style={{color:'var(--green)'}}>{competitorData.online}</div><div className="comp-key">Online</div></div>
                    <div className="comp-stat"><div className="comp-val" style={{color:'var(--red)'}}>{competitorData.offline}</div><div className="comp-key">No Site</div></div>
                    <div className="comp-stat"><div className="comp-val" style={{color:'var(--yellow)'}}>{competitorData.avgRating}</div><div className="comp-key">Avg Rating</div></div>
                  </div>
                  <div className="comp-bar-wrap">
                    <div className="comp-bar-label"><span>Offline ({competitorData.total>0?Math.round(competitorData.offline/competitorData.total*100):0}% opportunity)</span><span>{competitorData.offline}/{competitorData.total}</span></div>
                    <div className="comp-bar-track"><div className="comp-bar-fill" style={{width:`${competitorData.total>0?(competitorData.offline/competitorData.total)*100:0}%`}}/></div>
                  </div>
                </div>
              ):(
                <div className="pro-lock" style={{marginBottom:'12px'}} onClick={()=>setShowProModal(true)}>
                  <div className="pro-lock-ico">📊</div>
                  <div className="pro-lock-title">Competitor Analysis</div>
                  <div className="pro-lock-sub">See market breakdown — how many competitors are online vs offline</div>
                  <button className="pro-lock-btn">Unlock Pro ⚡</button>
                </div>
              )}

              <div className="toolbar">
                {[{k:'all',l:'All'},{k:'nowebsite',l:'No website'},{k:'haswebsite',l:'Has website'}].map(f=>(<button key={f.k} className={`flt-btn ${filter===f.k?'on':''}`} onClick={()=>setFilter(f.k)}>{f.l}</button>))}
                <div className="exp-grp">
                  {isPro&&(<button className="exp-btn exp-wa" onClick={bulkWAExport}>📲 WA Export</button>)}
                  {isPro&&(<button className="exp-btn" style={{background:'rgba(167,139,250,0.05)',borderColor:'rgba(167,139,250,0.2)',color:'var(--purple)'}} onClick={saveAlert}>{alertSaved?'✓ Saved!':'🔔 Save Alert'}</button>)}
                  <button className="exp-btn exp-csv" onClick={()=>exportCSV(filtered,businessType,location)}>↓ CSV</button>
                  <button className="exp-btn exp-xls" onClick={()=>exportExcel(filtered,businessType,location)}>↓ Excel</button>
                </div>
              </div>

              {filtered.length===0?<div className="empty">No results match this filter.</div>:(
                <div className="results">
                  {filtered.map((l,i)=>{
                    const score=calcLeadScore(l)
                    const sc=scoreColor(score)
                    return(
                      <div key={i} className="result-item">
                        <div className="result-top">
                          <div>
                            <div className="r-idx">#{String(i+1).padStart(2,'0')}</div>
                            <div className="r-name">{l.name||'—'}</div>
                            {l.category&&<div className="r-cat">{l.category}</div>}
                            {l.rating&&<div className="r-rating">★ {l.rating}{l.reviews?` · ${l.reviews} reviews`:''}</div>}
                            <div className="r-details">
                              {l.phone&&<div className="r-row"><i className="r-ico">↗</i><span>{l.phone}</span></div>}
                              {l.address&&<div className="r-row"><i className="r-ico">◎</i><span>{l.address}</span></div>}
                              {l.website&&<div className="r-row"><i className="r-ico">⊕</i><a href={l.website} target="_blank" rel="noreferrer">{l.website.replace(/^https?:\/\//,'').slice(0,45)}</a></div>}
                            </div>
                            <div className="r-actions">
                              {l.url&&<a href={l.url} target="_blank" rel="noreferrer" className="maps-btn">📍 Maps</a>}
                              {getWALink(l.phone)&&<a href={getWALink(l.phone)} target="_blank" rel="noreferrer" className="wa-btn">💬 WhatsApp</a>}
                            </div>
                          </div>
                          <div className="r-right">
                            <span className={`site-badge ${l.hasWebsite?'badge-yes':'badge-no'}`}>{l.hasWebsite?'● Online':'● No Site'}</span>
                            {/* LEAD SCORE */}
                            <span className="score-badge" style={{color:sc,background:sc+'15',borderColor:sc+'30'}}>Score {score}/10</span>
                            <select className="status-sel" value={l.status||'new'} onChange={e=>updateStatus(leads.indexOf(l),e.target.value)}
                              style={{color:STATUS_OPTIONS.find(s=>s.value===(l.status||'new'))?.color,borderColor:STATUS_OPTIONS.find(s=>s.value===(l.status||'new'))?.color+'40',background:STATUS_OPTIONS.find(s=>s.value===(l.status||'new'))?.bg}}>
                              {STATUS_OPTIONS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                          </div>
                        </div>
                        {isPro?(<><button className="note-tog" onClick={()=>setExpandedNote(expandedNote===i?null:i)}>{expandedNote===i?'▲ Hide note':'▼ Add note'}</button>{expandedNote===i&&(<textarea className="note-area" placeholder="Add a note..." value={l.notes||''} onChange={e=>updateNote(leads.indexOf(l),e.target.value)}/>)}</>)
                          :(<button className="note-tog" onClick={()=>setShowProModal(true)}>🔒 Notes — Pro only</button>)}
                        <button className="pitch-tog" onClick={()=>generatePitch(i)}>✨ {expandedPitch===i&&pitches[i]?'Hide Pitch':'AI Pitch'}</button>
                        {expandedPitch===i&&(<div className="pitch-box">{pitchLoading===i?<div className="pitch-loading">✨ Generating...</div>:(<><div className="pitch-hdr"><span className="pitch-lbl">AI Pitch</span><button className="pitch-copy" onClick={()=>copyPitch(i)}>Copy</button></div><div className="pitch-text">{pitches[i]}</div></>)}</div>)}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <footer className="page-footer">
        <span className="ft">© 2025 LandSea</span>
        <span className="ft">Made with ♥ by <strong>Vibhansh</strong></span>
      </footer>
    </>
  )
}
