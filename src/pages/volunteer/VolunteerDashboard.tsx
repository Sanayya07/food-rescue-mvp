import { useEffect, useState } from 'react';
import { Truck, Package, MapPin, Clock, Check, ArrowRight, Route } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, EmptyState, Spinner, ErrorBanner } from '@/components/ui';
import { PickupStatusBadge } from '@/components/StatusBadge';
import { fetchOpenPickups, fetchVolunteerPickups, fetchProfilesByIds, acceptPickup, pickupDistance } from '@/lib/pickups';
import { formatDistance } from '@/lib/geo';
import { timeRemaining, formatDateTime } from '@/lib/format';
import type { Pickup, Profile } from '@/lib/types';

interface Props {
  onSelectPickup: (id: string) => void;
}

export function VolunteerDashboard({ onSelectPickup }: Props) {
  const { profile } = useAuth();
  const [openPickups, setOpenPickups] = useState<Pickup[]>([]);
  const [myPickups, setMyPickups] = useState<Pickup[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [open, mine] = await Promise.all([
        fetchOpenPickups(),
        fetchVolunteerPickups(profile.id),
      ]);
      setOpenPickups(open);
      setMyPickups(mine);
      const allProfiles = await fetchProfilesByIds([
        ...open.map((p) => p.provider_id),
        ...open.map((p) => p.ngo_id),
        ...mine.map((p) => p.provider_id),
        ...mine.map((p) => p.ngo_id),
      ]);
      setProfiles(allProfiles);
    } catch {
      setError('Failed to load pickups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleAccept = async (id: string) => {
    if (!profile) return;
    setAccepting(id);
    setError(null);
    try {
      await acceptPickup(id, profile.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept pickup.');
    } finally {
      setAccepting(null);
    }
  };

  const myActive = myPickups.filter((p) => p.status === 'assigned' || p.status === 'collected');
  const myDone = myPickups.filter((p) => p.status === 'delivered' || p.status === 'cancelled');

  return (
    <div>
      <PageHeader
        title={`Hello, ${profile?.name?.split(' ')[0] ?? 'there'}`}
        subtitle="Help move surplus food from providers to communities."
      />
      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {loading ? (
        <Spinner label="Loading pickups…" />
      ) : (
        <div className="space-y-8">
          {/* My active pickups */}
          {myActive.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-brand-500" />
                Your active pickups ({myActive.length})
              </h2>
              <div className="space-y-3">
                {myActive.map((p) => (
                  <PickupCard
                    key={p.id}
                    pickup={p}
                    provider={profiles[p.provider_id]}
                    ngo={profiles[p.ngo_id]}
                    onOpen={() => onSelectPickup(p.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Open pickups */}
          <section>
            <h2 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4 text-ink-500" />
              Available pickups ({openPickups.length})
            </h2>
            {openPickups.length === 0 ? (
              <EmptyState
                icon={<Truck className="h-6 w-6" />}
                title="No open pickups right now"
                description="When providers accept NGO requests, pickup tasks will appear here for you to claim."
              />
            ) : (
              <div className="space-y-3">
                {openPickups.map((p) => (
                  <PickupCard
                    key={p.id}
                    pickup={p}
                    provider={profiles[p.provider_id]}
                    ngo={profiles[p.ngo_id]}
                    onAccept={() => handleAccept(p.id)}
                    accepting={accepting === p.id}
                    onOpen={() => onSelectPickup(p.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* History */}
          {myDone.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-ink-700 mb-3">Your completed pickups</h2>
              <div className="space-y-3">
                {myDone.map((p) => (
                  <PickupCard
                    key={p.id}
                    pickup={p}
                    provider={profiles[p.provider_id]}
                    ngo={profiles[p.ngo_id]}
                    onOpen={() => onSelectPickup(p.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function PickupCard({
  pickup,
  provider,
  ngo,
  onAccept,
  accepting,
  onOpen,
}: {
  pickup: Pickup;
  provider?: Profile;
  ngo?: Profile;
  onAccept?: () => void;
  accepting?: boolean;
  onOpen?: () => void;
}) {
  const distance = pickupDistance(pickup);
  const expired = new Date(pickup.required_by).getTime() < Date.now();
  const isOpen = pickup.status === 'open';
  const isActive = pickup.status === 'assigned' || pickup.status === 'collected';

  return (
    <div className="card p-5 animate-fadeIn">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Package className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-ink-900 truncate">{pickup.food_name}</h3>
            <p className="text-xs text-ink-500">{pickup.quantity} portions</p>
          </div>
        </div>
        <PickupStatusBadge status={pickup.status} />
      </div>

      {/* Route */}
      <div className="rounded-xl bg-ink-50 p-3 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex flex-col items-center">
            <span className="flex h-2.5 w-2.5 rounded-full bg-brand-500" />
            <span className="w-px h-5 bg-ink-300" />
            <span className="flex h-2.5 w-2.5 rounded-full bg-accent-500" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <p className="text-[11px] text-ink-400">Pickup</p>
              <p className="text-sm font-medium text-ink-700 truncate">{pickup.pickup_location_label}</p>
              <p className="text-[11px] text-ink-400">{provider?.org_name ?? provider?.name}</p>
            </div>
            <div>
              <p className="text-[11px] text-ink-400">Drop-off</p>
              <p className="text-sm font-medium text-ink-700 truncate">{pickup.drop_location_label}</p>
              <p className="text-[11px] text-ink-400">{ngo?.org_name ?? ngo?.name}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] text-ink-400 flex items-center gap-1 justify-end">
              <Route className="h-3 w-3" /> Distance
            </p>
            <p className="text-sm font-bold text-ink-800">{formatDistance(distance)}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs flex items-center gap-1 ${expired ? 'text-red-600 font-medium' : 'text-ink-500'}`}>
          <Clock className="h-3.5 w-3.5" />
          {expired ? 'Overdue' : timeRemaining(pickup.required_by)}
          <span className="text-ink-400">· {formatDateTime(pickup.required_by)}</span>
        </span>
        <div className="flex items-center gap-2">
          {isOpen && onAccept && (
            <button onClick={onAccept} disabled={accepting} className="btn-primary text-sm">
              {accepting ? 'Accepting…' : 'Accept Pickup'}
            </button>
          )}
          {isActive && onOpen && (
            <button onClick={onOpen} className="btn-primary text-sm">
              Open <ArrowRight className="h-4 w-4" />
            </button>
          )}
          {pickup.status === 'delivered' && onOpen && (
            <span className="badge bg-brand-100 text-brand-700">
              <Check className="h-3 w-3" /> Delivered
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
