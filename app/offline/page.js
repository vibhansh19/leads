'use client'

export default function Offline() {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',background:'#09090B',color:'#FAFAFA',fontFamily:'-apple-system,sans-serif',textAlign:'center',gap:'12px'}}>
      <div style={{fontSize:'40px'}}>📡</div>
      <div style={{fontSize:'20px',fontWeight:'700',letterSpacing:'-0.03em'}}>You're offline</div>
      <div style={{fontSize:'13px',color:'#52525B'}}>Check your connection and try again.</div>
      <button
        onClick={()=>window.location.reload()}
        style={{marginTop:'16px',height:'38px',padding:'0 20px',borderRadius:'8px',border:'1px solid #27272A',background:'transparent',color:'#A1A1AA',fontFamily:'inherit',fontSize:'13px',cursor:'pointer'}}
      >
        Retry
      </button>
    </div>
  )
}
