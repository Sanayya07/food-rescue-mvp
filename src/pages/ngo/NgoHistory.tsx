import { useEffect, useState } from 'react';
import { History, Package, MapPin, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, EmptyState, Spinner } from '@/components/ui';
import { fetchRequestsForNgo, fetchListingsByIds } from '@/lib/requests';
import { formatDateTime } from '@/lib/format';
import type { FoodRequest, FoodListing } from '@/lib/types';

export function NgoHistory() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<FoodRequest[]>([]);
  const [listings, setListings] = useState<Record<string, FoodListing>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    fetchRequestsForNgo(profile.id)
      .then(async (reqs) => {
        setRequests(reqs);
        const map = await fetchListingsByIds(reqs.map((r) => r.listing_id));
        setListings(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profile]);

  const completed = requests.filter((r) => listings[r.listing_id]?.status === 'COMPLETED');
  const mealsReceived = completed.reduce((sum, r) => sum + r.requested_quantity, 0);

  return (
    <div>
      <PageHeader title="History" subtitle="Food your community has received through FoodBridge." />

      {completed.length > 0 && (
        <div className="card p-5 mb-5 bg-gradient-to-br from-brand-50 to-brand-100/50 border-brand-200">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <Check className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink-900">{mealsReceived}</p>
              <p className="text-sm text-ink-600">meals received across {completed.length} deliveries</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <Spinner label="Loading history…" />
      ) : completed.length === 0 ? (
        <EmptyState
          icon={<History className="h-6 w-6" />}
          title="No completed deliveries yet"
          description="Once your accepted requests are picked up and delivered, they'll appear here."
        />
      ) : (
        <div className="space-y-3">
          {completed.map((req) => {
            const listing = listings[req.listing_id];
            return (
              <div key={req.id} className="card p-5 animate-fadeIn">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-ink-900 truncate">{listing?.food_name}</h3>
                    <p className="text-xs text-ink-500 mt-0.5">{listing?.food_type}</p>
                  </div>
                  <span className="badge bg-brand-100 text-brand-700">
                    <Check className="h-3 w-3" /> Delivered
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500 pt-3 border-t border-ink-100 mt-3">
                  <span className="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    <span className="font-semibold text-ink-700">{req.requested_quantity}</span> portions
                  </span>
                  {listing?.pickup_location_label && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {listing.pickup_location_label}
                    </span>
                  )}
                  <span>Completed {formatDateTime(req.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
