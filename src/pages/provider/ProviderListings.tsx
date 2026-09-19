import { useEffect, useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, EmptyState, Spinner, ErrorBanner } from '@/components/ui';
import { FoodCard } from '@/components/FoodCard';
import { fetchProviderListings, updateListingStatus } from '@/lib/listings';
import type { FoodListing, ListingStatus } from '@/lib/types';
import type { PageId } from '@/components/AppLayout';

interface Props {
  onNavigate: (page: PageId) => void;
  onSelectListing: (id: string) => void;
}

const filters: Array<{ id: 'all' | ListingStatus; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'AVAILABLE', label: 'Available' },
  { id: 'REQUESTED', label: 'Requested' },
  { id: 'ACCEPTED', label: 'Accepted' },
  { id: 'PICKUP_ASSIGNED', label: 'Pickup Assigned' },
  { id: 'PICKED_UP', label: 'Picked Up' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export function ProviderListings({ onNavigate, onSelectListing }: Props) {
  const { profile } = useAuth();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ListingStatus>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadListings = () => {
    if (!profile) return Promise.resolve();
    return fetchProviderListings(profile.id).then(setListings);
  };

  useEffect(() => {
    loadListings()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profile]);

  const handleCancel = async (listingId: string) => {
    setCancellingId(listingId);
    setCancelError(null);
    try {
      await updateListingStatus(listingId, 'CANCELLED');
      await loadListings();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Failed to cancel listing.');
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = filter === 'all'
    ? listings
    : listings.filter((l) => {
        const expired = new Date(l.available_until).getTime() < Date.now();
        return l.status === filter && !(filter === 'AVAILABLE' && expired);
      });

  return (
    <div>
      <PageHeader
        title="My Listings"
        subtitle="All the surplus food you've posted."
        action={
          <button onClick={() => onNavigate('post-food')} className="btn-primary">
            <Plus className="h-4 w-4" />
            Post Food
          </button>
        }
      />

      {cancelError && <div className="mb-4"><ErrorBanner message={cancelError} /></div>}

      <div className="flex flex-wrap gap-2 mb-5">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === f.id
                ? 'bg-brand-600 text-white'
                : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading listings…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="No listings here"
          description="When you post surplus food, it will appear here."
          action={
            <button onClick={() => onNavigate('post-food')} className="btn-primary">
              <Plus className="h-4 w-4" />
              Post Surplus Food
            </button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((l) => (
            <FoodCard
              key={l.id}
              listing={l}
              onClick={() => onSelectListing(l.id)}
              ctaLabel="Manage"
              showExpiredStatus
              onCancel={l.status === 'AVAILABLE' ? () => handleCancel(l.id) : undefined}
              cancelLoading={cancellingId === l.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
