import { PrismaClient, PlanTier } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Seed Plan Configurations
  console.log('📋 Seeding plan configurations...')

  const planConfigs = [
    {
      planTier: PlanTier.FREE,
      maxApps: 3,
      maxBuilds: 0,
      maxExports: 5,
      maxTemplates: 3,
      maxApiCalls: 100,
      maxStorageMB: 100,
      customDomain: false,
      prioritySupport: false,
      removeWatermark: false,
      teamCollaboration: false,
      analytics: false,
      versionHistory: false,
      aiAssistant: true,
      priceMonthly: 0,
      priceYearly: 0,
    },
    {
      planTier: PlanTier.PRO,
      maxApps: -1, // unlimited
      maxBuilds: 10,
      maxExports: -1, // unlimited
      maxTemplates: -1, // all templates
      maxApiCalls: 10000,
      maxStorageMB: 5000,
      customDomain: true,
      prioritySupport: false,
      removeWatermark: true,
      teamCollaboration: false,
      analytics: true,
      versionHistory: true,
      aiAssistant: true,
      priceMonthly: 1900, // $19.00
      priceYearly: 19900, // $199.00 (save ~17%)
    },
    {
      planTier: PlanTier.TEAM,
      maxApps: -1,
      maxBuilds: 50,
      maxExports: -1,
      maxTemplates: -1,
      maxApiCalls: 100000,
      maxStorageMB: 50000,
      customDomain: true,
      prioritySupport: true,
      removeWatermark: true,
      teamCollaboration: true,
      analytics: true,
      versionHistory: true,
      aiAssistant: true,
      priceMonthly: 4900, // $49.00 per user
      priceYearly: 49900, // $499.00 per user (save ~17%)
    },
    {
      planTier: PlanTier.ENTERPRISE,
      maxApps: -1,
      maxBuilds: -1,
      maxExports: -1,
      maxTemplates: -1,
      maxApiCalls: -1,
      maxStorageMB: -1,
      customDomain: true,
      prioritySupport: true,
      removeWatermark: true,
      teamCollaboration: true,
      analytics: true,
      versionHistory: true,
      aiAssistant: true,
      priceMonthly: null, // Custom pricing
      priceYearly: null,
    },
  ]

  for (const config of planConfigs) {
    const planConfig = await prisma.planConfig.upsert({
      where: { planTier: config.planTier },
      update: config,
      create: config,
    })

    console.log(`✅ ${config.planTier} plan configured`)
  }

  console.log('✨ Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
