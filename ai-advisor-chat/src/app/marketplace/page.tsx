import type { Metadata } from 'next';
import { MarketplaceLayoutWithProvider } from '~/components/marketplace/MarketplaceLayout';

export const metadata: Metadata = {
  title: 'Advisor Marketplace | AI Advisor Chat',
  description: 'Discover and select expert advisors to join your advisory board. Browse featured advisors across business, marketing, technical, and other specialties.',
  keywords: ['advisors', 'marketplace', 'business advice', 'expert consultation', 'advisory board'],
};

export default async function MarketplacePage({ searchParams }: { searchParams?: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams || {};
  const resolvedTab = tab === 'my-advisors' ? 'my-advisors' : tab === 'teams' ? 'teams' : 'marketplace';
  return (
    <MarketplaceLayoutWithProvider
      initialTab={resolvedTab as any}
      showBackButton={true}
    />
  );
}
