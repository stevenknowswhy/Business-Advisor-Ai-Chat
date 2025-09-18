import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";

const CONTENT_DIR = path.join(process.cwd(), "src", "content", "blog");

export async function generateStaticParams() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));
  return files.map((file) => ({ slug: file.replace(/\.mdx$/, "") }));
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const filePath = path.join(CONTENT_DIR, `${params.slug}.mdx`);
  if (!fs.existsSync(filePath)) return notFound();
  const source = fs.readFileSync(filePath, "utf8");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <Link href="/blog" className="text-primary-600 hover:underline">← Back to Blog</Link>
      </div>
      <article className="prose prose-lg max-w-none">
        {/* Render MDX content */}
        {/* @ts-expect-error Server Component */}
        <MDXRemote source={source} />
      </article>
    </div>
  );
}

