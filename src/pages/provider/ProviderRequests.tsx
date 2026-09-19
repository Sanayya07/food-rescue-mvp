import { useEffect, useState } from 'react';
import { Inbox, MapPin, Package, Clock, Check, X, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, EmptyState, Spinner, ErrorBanner } from '@/components/ui';
import { RequestStatusBadge } from '@/components/StatusBadge';
import { fetchRequestsForProvider, fetchNgoProfiles, fetchListingsByIds, acceptRequest, rejectRequest } from '@/lib/requests';
import { formatDistance } from '@/lib/geo';
import { haversineKm } from '@/lib/geo';
import { formatDateTime } from '@/lib/format';
import type { FoodRequest, Profile, FoodListing } from '@/lib/types';

export function ProviderRequests() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<FoodRequest[]>([]);
  const [ngos, setNgos] = useState<Record<string, Profile>>({});
  const [listings, setListings] = useState<Record<string, FoodListing>>({});
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const reqs = await fetchRequestsForProvider(profile.id);
      setRequests(reqs);
      const ngoMap = await fetchNgoProfiles(reqs.map((r) => r.ngo_id));
      setNgos(ngoMap);
      const listingMap = await fetchListingsByIds(reqs.map((r) => r.listing_id));
      setListings(listingMap);
    } catch {
      setError('Failed to load requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleAccept = async (req: FoodRequest) => {
    if (!profile) return;
    const listing = listings[req.listing_id];
    const ngo = ngos[req.ngo_id];
    if (!listing || !ngo) return;
    setActioning(req.id);
    setError(null);
    try {
      await acceptRequest(req, listing, ngo);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept request.');
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (req: FoodRequest) => {
    setActioning(req.id);
    setError(null);
    try {
      await rejectRequest(req.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request.');
    } finally {
      setActioning(null);
    }
  };

  const pending = requests.filter((r) => r.status === 'pending');
  const decided = requests.filter((r) => r.status !== 'pending');

  return (
    <div>
      <PageHeader title="Requests" subtitle="NGO requests for your surplus food listings." />
      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {loading ? (
        <Spinner label="Loading requests…" />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="No requests yet"
          description="When NGOs request your listings, they'll appear here for you to accept or reject."
        />
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-amber-400" />
                Pending ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((req) => {
                  const ngo = ngos[req.ngo_id];
                  const listing = listings[req.listing_id];
                  const distance = listing && ngo?.location_lat != null
                    ? haversineKm(listing.pickup_lat, listing.pickup_lng, ngo.location_lat, ngo.location_lng)
                    : undefined;
                  return (
                    <RequestRow
                      key={req.id}
                      req={req}
                      ngo={ngo}
                      listing={listing}
                      distance={distance}
                      actioning={actioning === req.id}
                      onAccept={() => handleAccept(req)}
                      onReject={() => handleReject(req)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {decided.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-ink-700 mb-3">History</h2>
              <div className="space-y-3">
                {decided.map((req) => {
                  const ngo = ngos[req.ngo_id];
                  const listing = listings[req.listing_id];
                  return (
                    <RequestRow key={req.id} req={req} ngo={ngo} listing={listing} actioning={false} />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RequestRow({
  req,
  ngo,
  listing,
  distance,
  actioning,
  onAccept,
  onReject,
}: {
  req: FoodRequest;
  ngo?: Profile;
  listing?: FoodListing;
  distance?: number;
  actioning: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  return (
    <div className="card p-5 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 text-sm font-bold">
            {ngo?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-ink-900 truncate">{ngo?.org_name ?? ngo?.name ?? 'NGO'}</h3>
              <RequestStatusBadge status={req.status} />
            </div>
            <p className="text-sm text-ink-500 mt-0.5">{listing?.food_name ?? 'Listing'}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-ink-500">
              <span className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                <span className="font-semibold text-ink-700">{req.requested_quantity}</span> / {listing?.quantity} portions
              </span>
              {distance !== undefined && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {formatDistance(distance)}
                </span>
              )}
              {ngo?.location_label && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {ngo.location_label}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDateTime(req.created_at)}
              </span>
            </div>
          </div>
        </div>

        {req.status === 'pending' && onAccept && onReject && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onAccept} disabled={actioning} className="btn-primary text-sm">
              <Check className="h-4 w-4" />
              Accept
            </button>
            <button onClick={onReject} disabled={actioning} className="btn-danger text-sm">
              <X className="h-4 w-4" />
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
