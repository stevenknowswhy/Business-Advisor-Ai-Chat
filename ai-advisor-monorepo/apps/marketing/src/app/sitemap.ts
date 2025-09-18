export const dynamic = 'force-static'

export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const now = new Date();
  return [
    { url: `${baseUrl}/`, lastModified: now },
    { url: `${baseUrl}/pricing`, lastModified: now },
    { url: `${baseUrl}/blog`, lastModified: now },
  ];
}

