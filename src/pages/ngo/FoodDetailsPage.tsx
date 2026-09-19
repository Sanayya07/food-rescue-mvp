import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, MapPin, Clock, Package, User as UserIcon, Building2, Info, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, Spinner, ErrorBanner } from '@/components/ui';
import { ListingStatusBadge } from '@/components/StatusBadge';
import { MatchBadge } from '@/components/MatchBadge';
import { fetchListingById, fetchProviderProfile } from '@/lib/listings';
import { createRequest } from '@/lib/requests';
import { haversineKm, formatDistance } from '@/lib/geo';
import { computeMatch } from '@/lib/matching';
import { formatDateTime, timeRemaining } from '@/lib/format';
import type { FoodListing, Profile, MatchLevel } from '@/lib/types';

interface Props {
  listingId: string;
  onBack: () => void;
  onRequestComplete: () => void;
}

export function FoodDetailsPage({ listingId, onBack, onRequestComplete }: Props) {
  const { profile } = useAuth();
  const [listing, setListing] = useState<FoodListing | null>(null);
  const [provider, setProvider] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestedQty, setRequestedQty] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchListingById(listingId)
      .then(async (l) => {
        setListing(l);
        if (l) {
          const p = await fetchProviderProfile(l.provider_id);
          setProvider(p);
          setRequestedQty(String(l.quantity));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [listingId]);

  if (loading) return <Spinner label="Loading food details…" />;

  if (!listing) {
    return (
      <div>
        <button onClick={onBack} className="btn-ghost text-sm mb-2 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <ErrorBanner message="This listing is no longer available." />
      </div>
    );
  }

  const distance = profile?.location_lat != null
    ? haversineKm(listing.pickup_lat, listing.pickup_lng, profile.location_lat, profile.location_lng ?? 0)
    : undefined;
  const match: { level: MatchLevel; reason: string } = computeMatch({
    distanceKm: distance,
    requestedQty: parseInt(requestedQty, 10) || undefined,
    availableQty: listing.quantity,
    availableUntil: listing.available_until,
  });
  const expired = new Date(listing.available_until).getTime() < Date.now();
  const canRequest = listing.status === 'AVAILABLE' || listing.status === 'REQUESTED';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const qty = parseInt(requestedQty, 10);
    if (!qty || qty <= 0) {
      setError('Enter a valid quantity.');
      return;
    }
    if (qty > listing.quantity) {
      setError(`You can request up to ${listing.quantity} portions.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createRequest(
        listing.id,
        profile.id,
        qty,
        profile.location_label ?? 'NGO location',
        profile.location_lat ?? 0,
        profile.location_lng ?? 0,
      );
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button onClick={onBack} className="btn-ghost text-sm mb-2 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to food
      </button>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Main */}
        <div className="md:col-span-2 space-y-5">
          <div className="card p-6 animate-fadeIn">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-ink-900">{listing.food_name}</h1>
                <p className="text-ink-500 text-sm mt-1">{listing.food_type} · {listing.quantity} portions available</p>
              </div>
              <ListingStatusBadge status={listing.status} />
            </div>

            {distance !== undefined && (
              <div className="mb-4">
                <MatchBadge level={match.level} reason={match.reason} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-y-4 gap-x-3 pt-4 border-t border-ink-100">
              <Detail icon={Package} label="Quantity" value={`${listing.quantity} portions`} />
              <Detail icon={MapPin} label="Pickup location" value={listing.pickup_location_label} />
              <Detail
                icon={Clock}
                label="Available until"
                value={expired ? 'Expired' : timeRemaining(listing.available_until)}
                sub={formatDateTime(listing.available_until)}
                danger={expired}
              />
              <Detail icon={Clock} label="Prepared at" value={formatDateTime(listing.prepared_at)} />
            </div>

            {listing.additional_info && (
              <div className="mt-5 rounded-xl bg-ink-50 p-4">
                <p className="text-xs font-semibold text-ink-500 mb-1 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" /> Additional information
                </p>
                <p className="text-sm text-ink-700">{listing.additional_info}</p>
              </div>
            )}
          </div>

          {/* Provider info */}
          {provider && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-ink-700 mb-3">Food provider</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-ink-900">{provider.org_name ?? provider.name}</p>
                  {provider.org_name && <p className="text-xs text-ink-500">{provider.name}</p>}
                  {provider.location_label && (
                    <p className="text-xs text-ink-500 flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3 w-3" /> {provider.location_label}
                    </p>
                  )}
                </div>
                {distance !== undefined && (
                  <div className="ml-auto text-right">
                    <p className="text-xs text-ink-400">Distance</p>
                    <p className="text-sm font-semibold text-ink-800">{formatDistance(distance)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Request sidebar */}
        <div>
          <div className="card p-6 sticky top-6 animate-fadeIn">
            {success ? (
              <div className="text-center py-4">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-ink-900">Request submitted!</h3>
                <p className="text-sm text-ink-500 mt-1.5">
                  The provider will review your request. You can track its status in your Requests page.
                </p>
                <button onClick={onRequestComplete} className="btn-primary w-full mt-5">
                  View My Requests
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-ink-900 mb-1">Request this food</h3>
                <p className="text-sm text-ink-500 mb-4">Specify how many portions your community needs.</p>

                {error && <div className="mb-3"><ErrorBanner message={error} /></div>}

                {expired && (
                  <div className="mb-3 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> This listing has expired.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label">Requested quantity</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={1}
                        max={listing.quantity}
                        value={requestedQty || 1}
                        onChange={(e) => setRequestedQty(e.target.value)}
                        className="flex-1 accent-brand-600"
                        disabled={!canRequest || expired}
                      />
                      <div className="w-20 shrink-0">
                        <input
                          type="number"
                          min={1}
                          max={listing.quantity}
                          value={requestedQty}
                          onChange={(e) => setRequestedQty(e.target.value)}
                          className="input text-center"
                          disabled={!canRequest || expired}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-ink-400 mt-1.5">
                      <span>1</span>
                      <span className="font-semibold text-ink-600">
                        {requestedQty || 0} / {listing.quantity} portions
                      </span>
                      <span>{listing.quantity}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!canRequest || expired || submitting}
                    className="btn-primary w-full"
                  >
                    {submitting ? 'Submitting…' : 'Submit Request'}
                  </button>

                  {!canRequest && !expired && (
                    <p className="text-xs text-ink-400 text-center">
                      This listing is no longer accepting new requests.
                    </p>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  sub,
  danger,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  sub?: string;
  danger?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-ink-400 flex items-center gap-1.5 mb-0.5">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className={`text-sm font-semibold ${danger ? 'text-red-600' : 'text-ink-800'}`}>{value}</p>
      {sub && <p className="text-xs text-ink-400">{sub}</p>}
    </div>
  );
}
