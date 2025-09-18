import Link from "next/link";
import { ArrowRightIcon, ChatBubbleLeftRightIcon, UserGroupIcon, LightBulbIcon } from "@heroicons/react/24/outline";
import { Button } from "@ai-advisor/ui";

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-primary-600">AI Advisor Chat</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/pricing" className="text-gray-500 hover:text-gray-900">
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

      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Your Personal</span>{' '}
                  <span className="block text-primary-600 xl:inline">AI Advisory Board</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Get expert advice from specialized AI advisors. From investment strategies to technical architecture, 
                  our AI advisory board provides professional insights tailored to your specific needs.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link href="https://app.ai-advisor-chat.com/sign-up?plan=pro">
                      <Button size="lg" variant="primary" className="md:py-4 md:px-10">
                        Start Free Trial
                        <ArrowRightIcon className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link href="/pricing">
                      <Button size="lg" variant="secondary" className="md:py-4 md:px-10">
                        View Pricing
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-gradient-to-r from-primary-400 to-primary-600 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
            <div className="text-white text-center">
              <ChatBubbleLeftRightIcon className="h-24 w-24 mx-auto mb-4" />
              <p className="text-xl font-semibold">AI-Powered Conversations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Professional AI Advisors at Your Fingertips
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Access specialized expertise across multiple domains with our advanced AI advisory system.
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <UserGroupIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Specialized Advisors</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Choose from expert advisors in investment, technology, marketing, and more. Each with unique personalities and expertise.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <ChatBubbleLeftRightIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Real-time Conversations</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Engage in natural, flowing conversations with AI advisors that understand context and provide actionable insights.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <LightBulbIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Actionable Insights</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Get practical, implementable advice tailored to your specific situation and business needs.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-primary-600">Start your free trial today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link href="https://app.ai-advisor-chat.com/sign-up?plan=pro">
                <Button size="md" variant="primary">
                  Get started
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
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
