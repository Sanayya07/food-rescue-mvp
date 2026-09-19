import { useEffect, useState } from 'react';
import { Inbox, Package, MapPin, Clock, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, EmptyState, Spinner } from '@/components/ui';
import { RequestStatusBadge, ListingStatusBadge } from '@/components/StatusBadge';
import { fetchRequestsForNgo, fetchListingsByIds } from '@/lib/requests';
import { formatDateTime, timeRemaining } from '@/lib/format';
import type { FoodRequest, FoodListing } from '@/lib/types';

export function NgoRequests() {
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

  const active = requests.filter((r) => r.status === 'pending' || (r.status === 'accepted' && listings[r.listing_id]?.status !== 'COMPLETED'));
  const history = requests.filter((r) => !active.includes(r));

  return (
    <div>
      <PageHeader title="My Requests" subtitle="Track the status of food you've requested." />

      {loading ? (
        <Spinner label="Loading your requests…" />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="No requests yet"
          description="Browse available food on your Home page and request what your community needs."
        />
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-brand-500" />
                Active ({active.length})
              </h2>
              <div className="space-y-3">
                {active.map((req) => (
                  <RequestRow key={req.id} req={req} listing={listings[req.listing_id]} />
                ))}
              </div>
            </div>
          )}
          {history.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-ink-700 mb-3">History</h2>
              <div className="space-y-3">
                {history.map((req) => (
                  <RequestRow key={req.id} req={req} listing={listings[req.listing_id]} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RequestRow({ req, listing }: { req: FoodRequest; listing?: FoodListing }) {
  const expired = listing ? new Date(listing.available_until).getTime() < Date.now() : false;
  return (
    <div className="card p-5 animate-fadeIn">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-ink-900 truncate">{listing?.food_name ?? 'Food listing'}</h3>
          <p className="text-xs text-ink-500 mt-0.5">{listing?.food_type}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <RequestStatusBadge status={req.status} />
          {listing && <ListingStatusBadge status={listing.status} />}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500 pt-3 border-t border-ink-100">
        <span className="flex items-center gap-1">
          <Package className="h-3.5 w-3.5" />
          <span className="font-semibold text-ink-700">{req.requested_quantity}</span> / {listing?.quantity ?? '—'} portions
        </span>
        {listing?.pickup_location_label && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {listing.pickup_location_label}
          </span>
        )}
        {listing && (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {expired ? 'Expired' : timeRemaining(listing.available_until)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Building2 className="h-3.5 w-3.5" /> Requested {formatDateTime(req.created_at)}
        </span>
      </div>
    </div>
  );
}
