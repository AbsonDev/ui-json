'use client'

import { useState, useEffect } from 'react'
import { Check, X, Zap, Users, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function PricingPage() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly')
  const { track } = useAnalytics()

  // Track page view on mount
  useEffect(() => {
    track.trackPricingPageViewed('direct')
  }, [track])

  const plans = [
    {
      name: 'Free',
      description: 'Perfect for testing and small projects',
      price: { monthly: 0, yearly: 0 },
      priceId: { monthly: null, yearly: null },
      icon: Sparkles,
      features: [
        { text: '3 apps', included: true },
        { text: '5 JSON exports per month', included: true },
        { text: 'Basic templates (3)', included: true },
        { text: 'AI Assistant (10/day)', included: true },
        { text: 'Community support', included: true },
        { text: 'Mobile builds', included: false },
        { text: 'All export formats', included: false },
        { text: 'Remove watermark', included: false },
        { text: 'Analytics dashboard', included: false },
        { text: 'Version history (30 days)', included: false },
      ],
      cta: 'Get Started Free',
      ctaVariant: 'secondary' as const,
      popular: false,
    },
    {
      name: 'Pro',
      description: 'For professionals and growing teams',
      price: { monthly: 19, yearly: 199 },
      priceId: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || '',
        yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY || '',
      },
      icon: Zap,
      features: [
        { text: 'Unlimited apps', included: true },
        { text: 'Unlimited exports (all formats)', included: true },
        { text: 'All templates', included: true },
        { text: 'AI Assistant (100/day)', included: true },
        { text: '10 mobile builds per month', included: true },
        { text: 'Remove watermark', included: true },
        { text: 'Analytics dashboard', included: true },
        { text: 'Version history (30 days)', included: true },
        { text: 'Email support', included: true },
        { text: '14-day free trial', included: true, highlight: true },
      ],
      cta: 'Start Free Trial',
      ctaVariant: 'primary' as const,
      popular: true,
      badge: 'Most Popular',
    },
    {
      name: 'Team',
      description: 'For teams that need collaboration',
      price: { monthly: 49, yearly: 499 },
      priceId: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM_MONTHLY || '',
        yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM_YEARLY || '',
      },
      icon: Users,
      features: [
        { text: 'Everything in Pro', included: true, bold: true },
        { text: '50 mobile builds per month', included: true },
        { text: 'Team collaboration', included: true },
        { text: 'Real-time co-editing', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Priority support', included: true },
        { text: 'Version history (90 days)', included: true },
        { text: 'Custom templates', included: true },
        { text: 'SSO (coming soon)', included: true },
      ],
      cta: 'Start Free Trial',
      ctaVariant: 'primary' as const,
      popular: false,
    },
  ]

  async function handleCheckout(priceId: string | null, planName: string) {
    if (!priceId) {
      // Free plan - redirect to signup/dashboard
      track.trackUpgradeButtonClicked({
        location: 'pricing_page',
        targetPlan: 'FREE',
        currentPlan: 'NONE'
      })
      window.location.href = '/register'
      return
    }

    // Track checkout started
    const price = planName === 'Pro'
      ? (interval === 'monthly' ? 19 : 199)
      : (interval === 'monthly' ? 49 : 499)

    track.trackCheckoutStarted({
      planTier: planName.toUpperCase(),
      interval,
      price,
      source: 'pricing_page'
    })

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          planTier: planName.toUpperCase()
        })
      })

      if (!res.ok) {
        throw new Error('Checkout failed')
      }

      const { url } = await res.json()

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      track.trackCheckoutAbandoned({
        planTier: planName.toUpperCase(),
        interval
      })
      alert('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            UI-JSON
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
            Start for free. Scale as you grow. No hidden fees.
          </p>

          {/* Social Proof Counter */}
          <div className="flex items-center justify-center gap-6 text-sm mb-8">
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-full">
              <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
              <span className="text-gray-700 dark:text-gray-300">
                <strong className="font-semibold">1,247</strong> apps created this week
              </span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full">
              <span className="text-2xl">🔥</span>
              <span className="text-gray-700 dark:text-gray-300">
                <strong className="font-semibold">89</strong> users upgraded today
              </span>
            </div>
          </div>

          {/* Interval Toggle */}
          <div className="inline-flex items-center gap-4 bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setInterval('monthly')}
              className={`px-6 py-2 rounded-md transition font-medium ${
                interval === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('yearly')}
              className={`px-6 py-2 rounded-md transition font-medium flex items-center gap-2 ${
                interval === 'yearly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Yearly
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.name}
                className={`bg-white dark:bg-gray-800 rounded-2xl p-8 relative border-2 transition-all hover:shadow-xl ${
                  plan.popular
                    ? 'border-blue-600 shadow-lg scale-105'
                    : 'border-gray-200 dark:border-gray-700 shadow-md'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                    {plan.badge}
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${
                    plan.popular
                      ? 'bg-blue-100 dark:bg-blue-900'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      plan.popular
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {plan.description}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">
                      ${plan.price[interval]}
                    </span>
                    {plan.price[interval] > 0 && (
                      <span className="text-gray-600 dark:text-gray-400">
                        /{interval === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    )}
                  </div>
                  {interval === 'yearly' && plan.price.yearly > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      ${(plan.price.yearly / 12).toFixed(2)}/month billed annually
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleCheckout(
                    plan.priceId[interval],
                    plan.name
                  )}
                  className={`w-full py-3 rounded-lg font-medium mb-8 transition ${
                    plan.ctaVariant === 'primary'
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {plan.cta}
                </button>

                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-3 ${
                        feature.highlight ? 'bg-green-50 dark:bg-green-900/20 -mx-2 px-2 py-1 rounded' : ''
                      }`}
                    >
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included
                            ? feature.bold
                              ? 'font-semibold'
                              : ''
                            : 'text-gray-400 dark:text-gray-600'
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Savings Calculator for Yearly */}
        {interval === 'yearly' && (
          <div className="max-w-2xl mx-auto mb-16 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                💰 Annual Plan = Huge Savings
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                See how much you save by choosing the yearly plan
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pro Plan</div>
                  <div className="flex items-baseline gap-2 justify-center">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">$199</span>
                    <span className="text-gray-500 dark:text-gray-400">/year</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs $228/year monthly</div>
                  <div className="text-green-600 dark:text-green-400 font-semibold mt-2">
                    Save $29 (13%)
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Team Plan</div>
                  <div className="flex items-baseline gap-2 justify-center">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">$499</span>
                    <span className="text-gray-500 dark:text-gray-400">/year</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs $588/year monthly</div>
                  <div className="text-green-600 dark:text-green-400 font-semibold mt-2">
                    Save $89 (15%)
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                That's more than <strong>1 month free</strong> on every plan! 🎉
              </p>
            </div>
          </div>
        )}

        {/* Testimonials Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            What Our Users Say
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">⭐</span>
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                "Economizei 30 horas em 1 semana. O Pro se pagou no primeiro projeto. A ferramenta de IA é incrível!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  JS
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">João Silva</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Dev Freelancer</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">⭐</span>
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                "Criamos 5 apps para clientes em um mês. A capacidade de fazer mobile builds é um divisor de águas."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                  MC
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Maria Costa</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Agência Digital</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">⭐</span>
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                "Suporte incrível e a feature de colaboração em equipe economiza muito tempo. Recomendo!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                  RA
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Ricardo Alves</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Startup Founder</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl mb-2">🔒</div>
                <div className="font-semibold text-sm text-gray-900 dark:text-white">Secure Payments</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">256-bit SSL encryption</div>
              </div>
              <div>
                <div className="text-2xl mb-2">✓</div>
                <div className="font-semibold text-sm text-gray-900 dark:text-white">14-Day Trial</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">No credit card required</div>
              </div>
              <div>
                <div className="text-2xl mb-2">↩️</div>
                <div className="font-semibold text-sm text-gray-900 dark:text-white">Cancel Anytime</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Keep your data</div>
              </div>
              <div>
                <div className="text-2xl mb-2">🇧🇷</div>
                <div className="font-semibold text-sm text-gray-900 dark:text-white">Support in PT-BR</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Atendimento em português</div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <details
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
              onToggle={(e) => {
                if ((e.target as HTMLDetailsElement).open) {
                  track.trackFAQExpanded('Can I try Pro before paying?')
                }
              }}
            >
              <summary className="font-semibold cursor-pointer">
                Can I try Pro before paying?
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Yes! All paid plans come with a 14-day free trial. No credit card required.
                You can cancel anytime during the trial without being charged.
              </p>
            </details>

            <details
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
              onToggle={(e) => {
                if ((e.target as HTMLDetailsElement).open) {
                  track.trackFAQExpanded('What happens when I hit my limits on the Free plan?')
                }
              }}
            >
              <summary className="font-semibold cursor-pointer">
                What happens when I hit my limits on the Free plan?
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                You'll see a notification when you're close to your limit. Once you reach it,
                you'll be prompted to upgrade to continue. Your existing apps will remain accessible
                in read-only mode.
              </p>
            </details>

            <details
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
              onToggle={(e) => {
                if ((e.target as HTMLDetailsElement).open) {
                  track.trackFAQExpanded('Can I change plans later?')
                }
              }}
            >
              <summary className="font-semibold cursor-pointer">
                Can I change plans later?
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Absolutely! You can upgrade or downgrade at any time. Upgrades take effect
                immediately, and downgrades take effect at the end of your billing period.
              </p>
            </details>

            <details
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
              onToggle={(e) => {
                if ((e.target as HTMLDetailsElement).open) {
                  track.trackFAQExpanded('What payment methods do you accept?')
                }
              }}
            >
              <summary className="font-semibold cursor-pointer">
                What payment methods do you accept?
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                We accept all major credit cards (Visa, MasterCard, American Express) through
                our secure payment partner Stripe. We also support bank transfers for annual plans.
              </p>
            </details>

            <details
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
              onToggle={(e) => {
                if ((e.target as HTMLDetailsElement).open) {
                  track.trackFAQExpanded('Is there an Enterprise plan?')
                }
              }}
            >
              <summary className="font-semibold cursor-pointer">
                Is there an Enterprise plan?
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Yes! For teams that need custom limits, SSO, dedicated support, or white-label
                options, please contact us at enterprise@uijson.com for custom pricing.
              </p>
            </details>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to build amazing apps?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of developers building with UI-JSON
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  )
}
