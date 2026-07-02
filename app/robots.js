export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/blog', '/blog/*', '/leaderboard', '/login'],
        disallow: ['/dashboard', '/admin', '/api/*'],
      },
    ],
    sitemap: 'https://leadsgenvib.vercel.app/sitemap.xml',
  }
}
