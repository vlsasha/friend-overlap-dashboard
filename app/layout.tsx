export const metadata = {
  title: 'Friend Overlap Dashboard | Vana Cup',
  description: 'Discover overlapping connections between your Instagram and LinkedIn networks using Vana Data Portability',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Friend Overlap Dashboard',
    description: 'Analyze cross-platform social connections with Vana',
    url: 'https://your-app.vercel.app',
    siteName: 'Friend Overlap Dashboard',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Friend Overlap Dashboard Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Friend Overlap Dashboard',
    description: 'Analyze cross-platform social connections with Vana',
    images: ['/og-image.svg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#0a0a1a', color: '#e2e8f0', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
