import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Twitcher Pro - Industry-Leading Streaming Solutions',
  description: 'High-quality streaming automation for every need',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-900">
        {children}
      </body>
    </html>
  )
}
