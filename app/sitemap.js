export default function sitemap() {
  const base = 'https://leadsgenvib.vercel.app'
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/blog/how-to-find-web-development-clients-india`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog/local-business-no-website-india`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog/freelance-clients-india-2025`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/leaderboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
  ]
}
