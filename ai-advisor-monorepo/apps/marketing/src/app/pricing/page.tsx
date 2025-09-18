import Link from "next/link";
import { CheckIcon } from "@heroicons/react/24/outline";

const tiers = [
  {
    name: 'Free',
    id: 'free',
    href: 'https://app.ai-advisor-chat.com/sign-up?plan=free',
    price: '$0',
    description: 'Perfect for trying out our AI advisors.',
    features: [
      'Access to basic AI advisor (Gemini Flash)',
      'Up to 10 conversations per month',
      'Basic advisor personalities',
      'Email support',
    ],
    mostPopular: false,
  },
  {
    name: 'Base',
    id: 'base',
    href: 'https://app.ai-advisor-chat.com/sign-up?plan=base',
    price: '$19',
    description: 'Great for individuals and small teams.',
    features: [
      'Access to advanced AI advisor (GPT-4o Mini)',
      'Unlimited conversations',
      'All advisor personalities',
      'Priority email support',
      'Conversation history',
      'Export conversations',
    ],
    mostPopular: true,
  },
  {
    name: 'Premium',
    id: 'premium',
    href: 'https://app.ai-advisor-chat.com/sign-up?plan=premium',
    price: '$49',
    description: 'For professionals who need the best AI advice.',
    features: [
      'Access to premium AI advisor (Claude 3.5 Sonnet)',
      'Unlimited conversations',
      'All advisor personalities',
      'Custom advisor creation',
      'Priority support',
      'Advanced analytics',
      'Team collaboration features',
      'API access',
    ],
    mostPopular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-primary-600">AI Advisor Chat</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/pricing" className="text-primary-600 font-medium">
                Pricing
              </Link>
              <Link href="/blog" className="text-gray-500 hover:text-gray-900">
                Blog
              </Link>
              <Link
                href="https://app.ai-advisor-chat.com/sign-in"
                className="text-gray-500 hover:text-gray-900"
              >
                Sign In
              </Link>
              <Link
                href="https://app.ai-advisor-chat.com/sign-up"
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-base font-semibold leading-7 text-primary-600">Pricing</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Choose the right plan for you
            </p>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
            Start with our free plan and upgrade as your needs grow. All plans include access to our specialized AI advisors.
          </p>
          <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 xl:gap-x-12">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`rounded-3xl p-8 ring-1 ${
                  tier.mostPopular
                    ? 'ring-2 ring-primary-600 bg-primary-50'
                    : 'ring-gray-200'
                } xl:p-10`}
              >
                <div className="flex items-center justify-between gap-x-4">
                  <h3
                    id={tier.id}
                    className={`text-lg font-semibold leading-8 ${
                      tier.mostPopular ? 'text-primary-600' : 'text-gray-900'
                    }`}
                  >
                    {tier.name}
                  </h3>
                  {tier.mostPopular ? (
                    <p className="rounded-full bg-primary-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-primary-600">
                      Most popular
                    </p>
                  ) : null}
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-600">{tier.description}</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">{tier.price}</span>
                  <span className="text-sm font-semibold leading-6 text-gray-600">/month</span>
                </p>
                <Link
                  href={tier.href}
                  aria-describedby={tier.id}
                  className={`mt-6 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    tier.mostPopular
                      ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-500 focus-visible:outline-primary-600'
                      : 'text-primary-600 ring-1 ring-inset ring-primary-200 hover:ring-primary-300 focus-visible:outline-primary-600'
                  }`}
                >
                  Get started
                </Link>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon className="h-6 w-5 flex-none text-primary-600" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="mx-auto mt-16 max-w-2xl">
            <dl className="space-y-8">
              <div>
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  Can I switch plans at any time?
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
                </dd>
              </div>
              <div>
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  What's the difference between the AI models?
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Each tier uses a different AI model: Free uses Gemini Flash (fast, basic responses), Base uses GPT-4o Mini (balanced performance), and Premium uses Claude 3.5 Sonnet (most advanced reasoning and creativity).
                </dd>
              </div>
              <div>
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  Is there a free trial?
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Yes! Our Free plan lets you try the service with no commitment. You can also start a 7-day free trial of any paid plan.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-200 pt-8">
            <p className="text-base text-gray-400 text-center">
              &copy; 2024 AI Advisor Chat. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
