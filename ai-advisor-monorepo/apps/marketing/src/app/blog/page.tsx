import fs from "node:fs";
import path from "node:path";
import Link from "next/link";

function listPosts() {
  const dir = path.join(process.cwd(), "src", "content", "blog");
  if (!fs.existsSync(dir)) return [] as { slug: string; title: string; date: string }[];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      // Simple title from slug; frontmatter parsing can be added later
      const title = slug
        .split("-")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
      return { slug, title, date: "" };
    });
}

export default function BlogPage() {
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
              <Link href="/pricing" className="text-gray-500 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="/blog" className="text-primary-600 font-medium">
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
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              From the AI Advisor Blog
            </h2>
            <p className="mt-2 text-lg leading-8 text-gray-600">
              Insights, tips, and updates from the world of AI-powered business advice.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {listPosts().map((post) => (
              <article key={post.slug} className="flex flex-col items-start justify-between">
                <div className="relative w-full">
                  <div className="aspect-[16/9] w-full rounded-2xl bg-gray-100 sm:aspect-[2/1] lg:aspect-[3/2]">
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
                </div>
                <div className="max-w-xl">
                  <div className="group relative">
                    <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                      <Link href={`/blog/${post.slug}`}>
                        <span className="absolute inset-0" />
                        {post.title}
                      </Link>
                    </h3>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="bg-primary-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Stay updated with AI insights
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Get the latest articles and insights about AI-powered business advice delivered to your inbox.
            </p>
            <div className="mt-6 flex max-w-md gap-x-4 mx-auto">
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="min-w-0 flex-auto rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                placeholder="Enter your email"
              />
              <button
                type="submit"
                className="flex-none rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Subscribe
              </button>
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
