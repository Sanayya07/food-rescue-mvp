import { useEffect, useState } from 'react';
import { Plus, Package, Inbox, TrendingUp, Utensils } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, EmptyState, Spinner } from '@/components/ui';
import { FoodCard } from '@/components/FoodCard';
import { fetchProviderListings } from '@/lib/listings';
import type { FoodListing } from '@/lib/types';
import type { PageId } from '@/components/AppLayout';

interface Props {
  onNavigate: (page: PageId) => void;
  onSelectListing: (id: string) => void;
}

export function ProviderDashboard({ onNavigate, onSelectListing }: Props) {
  const { profile } = useAuth();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    fetchProviderListings(profile.id)
      .then(setListings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profile]);

  const activeListings = listings.filter(
    (l) =>
      !['COMPLETED', 'CANCELLED'].includes(l.status) &&
      new Date(l.available_until).getTime() >= Date.now(),
  );
  const completedCount = listings.filter((l) => l.status === 'COMPLETED').length;
  const mealsRescued = listings.filter((l) => l.status === 'COMPLETED').reduce((s, l) => s + l.quantity, 0);

  return (
    <div>
      <PageHeader
        title={`Hello, ${profile?.name?.split(' ')[0] ?? 'there'}`}
        subtitle="Here's what's happening with your surplus food."
        action={
          <button onClick={() => onNavigate('post-food')} className="btn-primary">
            <Plus className="h-4 w-4" />
            Post Surplus Food
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Active listings', value: activeListings.length, icon: Package, color: 'brand' },
          { label: 'Meals rescued', value: mealsRescued, icon: Utensils, color: 'accent' },
          { label: 'Completed', value: completedCount, icon: TrendingUp, color: 'blue' },
          { label: 'Total posted', value: listings.length, icon: Inbox, color: 'ink' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-${s.color}-50 text-${s.color}-600`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-ink-900">{s.value}</div>
              <div className="text-xs text-ink-500">{s.label}</div>
            </div>
          );
        })}
      </div>

      <h2 className="text-lg font-semibold text-ink-800 mb-3">Your active listings</h2>
      {loading ? (
        <Spinner label="Loading your listings…" />
      ) : activeListings.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="No active listings yet"
          description="Post your surplus food and NGOs nearby will see it and request it."
          action={
            <button onClick={() => onNavigate('post-food')} className="btn-primary">
              <Plus className="h-4 w-4" />
              Post Surplus Food
            </button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {activeListings.map((l) => (
            <FoodCard key={l.id} listing={l} onClick={() => onSelectListing(l.id)} ctaLabel="Manage" />
          ))}
        </div>
      )}
    </div>
  );
}
