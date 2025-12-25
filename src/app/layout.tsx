import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UI-JSON Visualizer',
  description: 'A live editor for the UI-JSON declarative language',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
