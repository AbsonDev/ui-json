import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/invoices
 * Returns user's invoice history
 */
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId: user.id },
      orderBy: { paidAt: 'desc' },
      take: 12, // Last 12 invoices
    })

    return NextResponse.json(
      invoices.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        paidAt: invoice.paidAt,
        hostedInvoiceUrl: invoice.hostedInvoiceUrl,
        invoicePdf: invoice.invoicePdf,
      }))
    )
  } catch (error) {
    console.error('Failed to fetch invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}
