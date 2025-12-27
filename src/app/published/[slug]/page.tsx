import { getPublishedApp, trackAppView } from '@/actions/apps'
import { PublishedAppRenderer } from '@/components/PublishedAppRenderer'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { Metadata } from 'next'

interface PageProps {
  params: {
    slug: string
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const app = await getPublishedApp(params.slug)

  if (!app) {
    return {
      title: 'App Not Found',
    }
  }

  return {
    title: `${app.name} | UI-JSON App`,
    description: app.description || `${app.name} - Created with UI-JSON Visualizer`,
    openGraph: {
      title: app.name,
      description: app.description || `${app.name} - Created with UI-JSON Visualizer`,
      type: 'website',
    },
  }
}

export default async function PublishedAppPage({ params }: PageProps) {
  const app = await getPublishedApp(params.slug)

  if (!app) {
    notFound()
  }

  // Track view (async, non-blocking)
  const headersList = headers()
  const userAgent = headersList.get('user-agent') || undefined
  const referrer = headersList.get('referer') || undefined
  const forwardedFor = headersList.get('x-forwarded-for')
  const visitorIp = forwardedFor?.split(',')[0] || headersList.get('x-real-ip') || undefined

  // Generate session ID from IP + User Agent (simple approach)
  const sessionId = visitorIp && userAgent
    ? Buffer.from(`${visitorIp}-${userAgent}`).toString('base64').substring(0, 32)
    : undefined

  trackAppView(app.id, {
    visitorIp,
    userAgent,
    referrer,
    sessionId,
  }).catch(() => {
    // Silent fail - don't break the page if analytics fails
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* App Renderer */}
      <PublishedAppRenderer
        app={app}
        showWatermark={app.showWatermark}
      />
    </div>
  )
}

// Enable ISR (Incremental Static Regeneration)
// Revalidate every 60 seconds to keep stats fresh
export const revalidate = 60
