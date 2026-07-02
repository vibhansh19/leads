import Link from 'next/link'
import config from '../../config'  // 2 levels up

export const metadata = {
  title: 'Blog — LandSea | Web Development Lead Generation India',
  description: 'Tips and guides for freelancers and web developers to find more clients in India. Lead generation strategies, cold outreach, and more.',
}

const posts = [
  {
    slug: 'how-to-find-web-development-clients-india',
    title: 'How to Find Web Development Clients in India (2025 Guide)',
    desc: 'A complete guide for freelance web developers to find local businesses that need a website across India.',
    date: 'Feb 2025',
    readTime: '5 min',
    tag: 'Lead Generation',
    tagColor: '#22C55E',
  },
  {
    slug: 'local-business-no-website-india',
    title: '70% of Indian Local Businesses Have No Website — Here\'s Your Opportunity',
    desc: 'Most local businesses in India are still offline. Learn how to identify and approach them as potential clients.',
    date: 'Feb 2025',
    readTime: '4 min',
    tag: 'Opportunity',
    tagColor: '#EAB308',
  },
  {
    slug: 'freelance-clients-india-2025',
    title: 'Cold Outreach That Actually Works for Indian Freelancers',
    desc: 'How to write cold messages and emails that get replies from local business owners in India.',
    date: 'Feb 2025',
    readTime: '6 min',
    tag: 'Outreach',
    tagColor: '#60A5FA',
  },
]

export default function BlogIndex() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{-webkit-font-smoothing:antialiased}
        body{background:#09090B;color:#FAFAFA;font-family:'Geist',sans-serif;min-height:100vh}

        .nav{height:54px;border-bottom:1px solid #1F1F23;display:flex;align-items:center;padding:0 24px;background:rgba(9,9,11,0.9);backdrop-filter:blur(20px);position:sticky;top:0;z-index:100}
        .nav-inner{max-width:720px;width:100%;margin:0 auto;display:flex;align-items:center;justify-content:space-between}
        .logo{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;color:#FAFAFA;letter-spacing:-0.02em;text-decoration:none}
        .logo-sq{width:26px;height:26px;background:#FAFAFA;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;color:#09090B;font-weight:800}
        .nav-links{display:flex;gap:8px}
        .nav-link{height:30px;padding:0 12px;border-radius:7px;border:1px solid #27272A;background:transparent;color:#71717A;font-family:'Geist',sans-serif;font-size:12px;font-weight:500;cursor:pointer;text-decoration:none;display:flex;align-items:center;transition:all .12s}
        .nav-link:hover{border-color:#3F3F46;color:#A1A1AA}
        .nav-link.cta{background:#FAFAFA;border-color:#FAFAFA;color:#09090B;font-weight:600}
        .nav-link.cta:hover{opacity:.85}

        .main{max-width:720px;margin:0 auto;padding:64px 24px 80px}

        .page-tag{font-size:11px;font-weight:600;color:#52525B;letter-spacing:.1em;text-transform:uppercase;margin-bottom:16px;display:flex;align-items:center;gap:8px}
        .page-tag::before{content:'';width:16px;height:1px;background:#27272A}
        .page-title{font-size:clamp(28px,4vw,42px);font-weight:800;letter-spacing:-0.05em;line-height:1.05;margin-bottom:12px}
        .page-sub{font-size:14px;color:#71717A;line-height:1.7;margin-bottom:56px;max-width:480px}

        .posts{display:flex;flex-direction:column;gap:1px;background:#1F1F23;border:1px solid #1F1F23;border-radius:14px;overflow:hidden}
        .post-card{background:#09090B;padding:28px 32px;transition:background .15s;text-decoration:none;display:block}
        .post-card:hover{background:#111113}
        .post-top{display:flex;align-items:center;gap:8px;margin-bottom:14px}
        .post-tag{font-size:10px;font-weight:700;padding:3px 9px;border-radius:5px;letter-spacing:.06em;text-transform:uppercase}
        .post-date{font-size:11px;color:#3F3F46}
        .post-dot{width:3px;height:3px;background:#3F3F46;border-radius:50%}
        .post-read{font-size:11px;color:#3F3F46}
        .post-title{font-size:18px;font-weight:700;letter-spacing:-0.03em;color:#FAFAFA;margin-bottom:8px;line-height:1.3}
        .post-desc{font-size:13px;color:#71717A;line-height:1.7}
        .post-arrow{margin-top:16px;font-size:12px;color:#3F3F46;display:flex;align-items:center;gap:4px;transition:color .12s}
        .post-card:hover .post-arrow{color:#71717A}

        .footer{border-top:1px solid #1A1A1C;padding:20px 24px;max-width:720px;margin:0 auto;display:flex;justify-content:space-between;font-size:11px;color:#3F3F46;flex-wrap:wrap;gap:8px}

        @media(max-width:520px){.main{padding:40px 16px 60px}.post-card{padding:20px}}
      `}</style>

      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="logo"><div className="logo-sq">LS</div>LandSea</a>
          <div className="nav-links">
            <a href="/dashboard" className="nav-link">Dashboard</a>
            <a href="/signup" className="nav-link cta">Get Started →</a>
          </div>
        </div>
      </nav>

      <main className="main">
        <div className="page-tag">Blog</div>
        <h1 className="page-title">Guides for Indian freelancers.</h1>
        <p className="page-sub">Tips on finding clients, cold outreach, and growing your web development business in India.</p>

        <div className="posts">
          {posts.map(p => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="post-card">
              <div className="post-top">
                <span className="post-tag" style={{color:p.tagColor,background:p.tagColor+'15',border:`1px solid ${p.tagColor}25`}}>{p.tag}</span>
                <div className="post-dot" />
                <span className="post-date">{p.date}</span>
                <div className="post-dot" />
                <span className="post-read">{p.readTime} read</span>
              </div>
              <div className="post-title">{p.title}</div>
              <div className="post-desc">{p.desc}</div>
              <div className="post-arrow">Read article →</div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="footer">
        <span>© 2025 LandSea</span>
        <span>Made with ♥ by Vibhansh</span>
      </footer>
    </>
  )
}
