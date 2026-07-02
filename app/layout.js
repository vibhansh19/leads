import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata = {
  title: 'LandSea — Find Local Businesses Without a Website in India',
  description: 'LandSea helps web developers and freelancers find local businesses in India with no website. Generate leads instantly from Google Maps. Free to start.',
  keywords: 'lead generation india, local business leads, web development clients india, no website businesses, freelance clients india',
  authors: [{ name: 'Vibhansh' }],
  creator: 'Vibhansh',
  openGraph: {
    title: 'LandSea — Find Local Businesses Without a Website',
    description: 'Find local businesses in India with no online presence. Your next paying client is one search away.',
    url: 'https://leadsgenvib.vercel.app',
    siteName: 'LandSea',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LandSea — Find Local Business Leads in India',
    description: 'Find businesses with no website across India. Free lead generation tool.',
  },
  manifest: '/manifest.json',
  icons: { icon: '/favicon.svg', apple: '/icon-192.png' },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#09090B',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LandSea" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#09090B' }}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
