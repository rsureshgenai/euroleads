import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EuroLeads | AI Lead Intelligence',
  description: 'AI-powered lead extraction, scoring, and outreach for European recruitment & B2B sales.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-ink-50 text-ink-900 font-sans antialiased">{children}</body>
    </html>
  )
}
