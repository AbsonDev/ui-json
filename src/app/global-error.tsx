'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { NextResponse } from 'next/server'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
            Algo deu errado!
          </h1>
          <p style={{ color: '#666', marginBottom: '24px', textAlign: 'center' }}>
            Desculpe pelo inconveniente. Nossa equipe foi notificada e estamos trabalhando para resolver o problema.
          </p>
          {error.digest && (
            <p style={{ color: '#999', fontSize: '14px', marginBottom: '24px' }}>
              Código do erro: {error.digest}
            </p>
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => reset()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Tentar novamente
            </button>
            <a
              href="/"
              style={{
                padding: '10px 20px',
                backgroundColor: '#f5f5f5',
                color: '#333',
                border: 'none',
                borderRadius: '5px',
                textDecoration: 'none',
                fontSize: '16px'
              }}
            >
              Voltar para o início
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
