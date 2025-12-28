/**
 * Next.js Instrumentation File
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * This file is used to initialize monitoring and observability tools.
 * It runs once when the server starts.
 */

import * as Sentry from '@sentry/nextjs'

export async function register() {
  // Server-side instrumentation
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { init } = await import('./sentry.server.config')
    init()
  }

  // Edge runtime instrumentation
  if (process.env.NEXT_RUNTIME === 'edge') {
    const { init } = await import('./sentry.edge.config')
    init()
  }
}

export async function onRequestError(
  err: Error,
  request: {
    path: string
    method: string
    headers: Headers
  },
  context: {
    routerKind: 'App Router' | 'Pages Router'
    routePath: string
    routeType: 'render' | 'route' | 'action' | 'middleware'
    revalidateReason?: 'on-demand' | 'stale'
    renderSource?: 'react-server-components' | 'react-server-components-payload' | 'server-rendering'
  }
) {
  Sentry.captureException(err, {
    tags: {
      'nextjs.router_kind': context.routerKind,
      'nextjs.router_path': context.routePath,
      'nextjs.route_type': context.routeType,
      'nextjs.request_path': request.path,
      'nextjs.request_method': request.method,
    },
    extra: {
      revalidate_reason: context.revalidateReason,
      render_source: context.renderSource,
    },
  })
}
