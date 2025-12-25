'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { encrypt, decrypt } from '@/lib/encryption'
import { Client } from 'pg'

const createConnectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['postgresql']).default('postgresql'),
  host: z.string().min(1, 'Host is required'),
  port: z.number().int().min(1).max(65535).default(5432),
  database: z.string().min(1, 'Database name is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  ssl: z.boolean().default(false),
})

const updateConnectionSchema = createConnectionSchema.partial().extend({
  id: z.string(),
})

/**
 * Get all database connections for the current user
 */
export async function getUserDatabaseConnections() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const connections = await prisma.databaseConnection.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { apps: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Don't return actual passwords!
  return connections.map((conn) => ({
    ...conn,
    password: '••••••••', // Masked for security
  }))
}

/**
 * Get a specific database connection (with decrypted password)
 */
export async function getDatabaseConnection(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const connection = await prisma.databaseConnection.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      _count: {
        select: { apps: true },
      },
    },
  })

  if (!connection) {
    throw new Error('Connection not found')
  }

  // Decrypt password for editing
  try {
    return {
      ...connection,
      password: decrypt(connection.password),
    }
  } catch (error) {
    console.error('Failed to decrypt password:', error)
    throw new Error('Failed to decrypt connection credentials')
  }
}

/**
 * Create a new database connection
 */
export async function createDatabaseConnection(
  data: z.infer<typeof createConnectionSchema>
) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const validated = createConnectionSchema.parse(data)

  // Encrypt password before storing
  const encryptedPassword = encrypt(validated.password)

  const connection = await prisma.databaseConnection.create({
    data: {
      ...validated,
      password: encryptedPassword,
      userId: session.user.id,
    },
  })

  revalidatePath('/dashboard/databases')

  return {
    ...connection,
    password: '••••••••', // Don't return real password
  }
}

/**
 * Update an existing database connection
 */
export async function updateDatabaseConnection(
  data: z.infer<typeof updateConnectionSchema>
) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const { id, password, ...rest } = updateConnectionSchema.parse(data)

  // Verify ownership
  const existing = await prisma.databaseConnection.findUnique({
    where: { id },
    select: { userId: true },
  })

  if (!existing || existing.userId !== session.user.id) {
    throw new Error('Connection not found or unauthorized')
  }

  // If password is being updated, encrypt it
  const updateData: any = { ...rest }
  if (password && password !== '••••••••') {
    updateData.password = encrypt(password)
  }

  const connection = await prisma.databaseConnection.update({
    where: { id },
    data: updateData,
  })

  revalidatePath('/dashboard/databases')

  return {
    ...connection,
    password: '••••••••',
  }
}

/**
 * Delete a database connection
 */
export async function deleteDatabaseConnection(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Verify ownership
  const existing = await prisma.databaseConnection.findUnique({
    where: { id },
    select: { userId: true, _count: { select: { apps: true } } },
  })

  if (!existing || existing.userId !== session.user.id) {
    throw new Error('Connection not found or unauthorized')
  }

  // Check if apps are using this connection
  if (existing._count.apps > 0) {
    throw new Error(
      `Cannot delete connection. ${existing._count.apps} app(s) are still using it.`
    )
  }

  await prisma.databaseConnection.delete({
    where: { id },
  })

  revalidatePath('/dashboard/databases')

  return { success: true }
}

/**
 * Test a database connection
 */
export async function testDatabaseConnection(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const connection = await prisma.databaseConnection.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
  })

  if (!connection) {
    throw new Error('Connection not found')
  }

  try {
    // Decrypt password
    const password = decrypt(connection.password)

    // Create connection string
    const connectionString = `postgresql://${connection.username}:${password}@${connection.host}:${connection.port}/${connection.database}${connection.ssl ? '?sslmode=require' : ''}`

    // Test connection
    const client = new Client({ connectionString })

    await client.connect()
    await client.query('SELECT 1') // Simple test query
    await client.end()

    // Update test status
    await prisma.databaseConnection.update({
      where: { id },
      data: {
        lastTestedAt: new Date(),
        lastTestStatus: 'success',
        lastTestError: null,
      },
    })

    revalidatePath('/dashboard/databases')

    return {
      success: true,
      message: 'Connection successful!',
    }
  } catch (error: any) {
    // Update test status with error
    await prisma.databaseConnection.update({
      where: { id },
      data: {
        lastTestedAt: new Date(),
        lastTestStatus: 'failed',
        lastTestError: error.message || 'Connection failed',
      },
    })

    revalidatePath('/dashboard/databases')

    return {
      success: false,
      message: error.message || 'Connection failed',
    }
  }
}

/**
 * Test connection before creating (doesn't save to DB)
 */
export async function testConnectionBeforeCreate(
  data: z.infer<typeof createConnectionSchema>
) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const validated = createConnectionSchema.parse(data)

  try {
    const connectionString = `postgresql://${validated.username}:${validated.password}@${validated.host}:${validated.port}/${validated.database}${validated.ssl ? '?sslmode=require' : ''}`

    const client = new Client({ connectionString })

    await client.connect()
    await client.query('SELECT 1')
    await client.end()

    return {
      success: true,
      message: 'Connection successful!',
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Connection failed',
    }
  }
}
