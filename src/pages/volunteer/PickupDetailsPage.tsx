import { useEffect, useState } from 'react';
import { ArrowLeft, Package, MapPin, Clock, Route, Check, Truck, User as UserIcon, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, Spinner, ErrorBanner } from '@/components/ui';
import { PickupStatusBadge } from '@/components/StatusBadge';
import { fetchPickupById, fetchProfilesByIds, acceptPickup, markCollected, markDelivered, pickupDistance } from '@/lib/pickups';
import { formatDistance } from '@/lib/geo';
import { formatDateTime, timeRemaining } from '@/lib/format';
import type { Pickup, Profile } from '@/lib/types';

interface Props {
  pickupId: string;
  onBack: () => void;
  onUpdate: () => void;
}

export function PickupDetailsPage({ pickupId, onBack, onUpdate }: Props) {
  const { profile } = useAuth();
  const [pickup, setPickup] = useState<Pickup | null>(null);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const p = await fetchPickupById(pickupId);
      setPickup(p);
      if (p) {
        const profs = await fetchProfilesByIds([p.provider_id, p.ngo_id, p.volunteer_id].filter(Boolean) as string[]);
        setProfiles(profs);
      }
    } catch {
      setError('Failed to load pickup.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupId]);

  const handleAction = async (action: 'accept' | 'collect' | 'deliver') => {
    if (!profile || !pickup) return;
    setActioning(true);
    setError(null);
    try {
      if (action === 'accept') await acceptPickup(pickup.id, profile.id);
      if (action === 'collect') await markCollected(pickup.id);
      if (action === 'deliver') await markDelivered(pickup.id);
      await load();
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setActioning(false);
    }
  };

  if (loading) return <Spinner label="Loading pickup details…" />;

  if (!pickup) {
    return (
      <div>
        <button onClick={onBack} className="btn-ghost text-sm mb-2 -ml-2"><ArrowLeft className="h-4 w-4" /> Back</button>
        <ErrorBanner message="This pickup could not be found." />
      </div>
    );
  }

  const provider = profiles[pickup.provider_id];
  const ngo = profiles[pickup.ngo_id];
  const volunteer = pickup.volunteer_id ? profiles[pickup.volunteer_id] : null;
  const distance = pickupDistance(pickup);
  const expired = new Date(pickup.required_by).getTime() < Date.now();
  const isMyPickup = pickup.volunteer_id === profile?.id;
  const canAccept = pickup.status === 'open';
  const canCollect = pickup.status === 'assigned' && isMyPickup;
  const canDeliver = pickup.status === 'collected' && isMyPickup;

  // Timeline steps
  const steps = [
    { label: 'Pickup accepted', done: pickup.status !== 'open', active: pickup.status === 'assigned' || pickup.status === 'collected' },
    { label: 'Food collected', done: ['collected', 'delivered'].includes(pickup.status), active: pickup.status === 'collected' },
    { label: 'Delivered to NGO', done: pickup.status === 'delivered', active: false },
  ];

  return (
    <div>
      <button onClick={onBack} className="btn-ghost text-sm mb-2 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to pickups
      </button>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-5">
          {/* Header */}
          <div className="card p-6 animate-fadeIn">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-ink-900">{pickup.food_name}</h1>
                  <p className="text-sm text-ink-500">{pickup.quantity} portions</p>
                </div>
              </div>
              <PickupStatusBadge status={pickup.status} />
            </div>

            {/* Route visualization */}
            <div className="rounded-2xl bg-ink-50 p-5 my-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-1">
                  <span className="flex h-3 w-3 rounded-full bg-brand-500 ring-4 ring-brand-100" />
                  <span className="w-px h-12 bg-ink-300 my-1" />
                  <span className="flex h-3 w-3 rounded-full bg-accent-500 ring-4 ring-accent-100" />
                </div>
                <div className="flex-1 space-y-5">
                  <div>
                    <p className="text-xs text-ink-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> Pickup from</p>
                    <p className="font-semibold text-ink-900">{pickup.pickup_location_label}</p>
                    <p className="text-xs text-ink-500 flex items-center gap-1 mt-0.5">
                      <UserIcon className="h-3 w-3" /> {provider?.org_name ?? provider?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> Deliver to</p>
                    <p className="font-semibold text-ink-900">{pickup.drop_location_label}</p>
                    <p className="text-xs text-ink-500 flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3 w-3" /> {ngo?.org_name ?? ngo?.name}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-ink-400 flex items-center gap-1 justify-end">
                    <Route className="h-3.5 w-3.5" /> Total
                  </p>
                  <p className="text-lg font-bold text-ink-900">{formatDistance(distance)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-ink-100">
              <div>
                <p className="text-xs text-ink-400 flex items-center gap-1.5 mb-0.5"><Clock className="h-3.5 w-3.5" /> Required by</p>
                <p className={`text-sm font-semibold ${expired && pickup.status !== 'delivered' ? 'text-red-600' : 'text-ink-800'}`}>
                  {expired && pickup.status !== 'delivered' ? 'Overdue' : timeRemaining(pickup.required_by)}
                </p>
                <p className="text-xs text-ink-400">{formatDateTime(pickup.required_by)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-400 flex items-center gap-1.5 mb-0.5"><Package className="h-3.5 w-3.5" /> Quantity</p>
                <p className="text-sm font-semibold text-ink-800">{pickup.quantity} portions</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card p-6">
            <h3 className="font-semibold text-ink-900 mb-4">Delivery progress</h3>
            <div className="space-y-1">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${
                    step.done ? 'bg-brand-600 text-white' : step.active ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-400'
                  }`}>
                    {step.done ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                  </div>
                  <span className={`text-sm ${step.done ? 'text-ink-800 font-medium' : step.active ? 'text-ink-700' : 'text-ink-400'}`}>
                    {step.label}
                  </span>
                  {step.active && <span className="ml-auto text-xs text-brand-600 font-semibold animate-pulse">In progress</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action sidebar */}
        <div>
          <div className="card p-6 sticky top-6 animate-fadeIn">
            <h3 className="font-semibold text-ink-900 mb-1">Pickup actions</h3>
            <p className="text-sm text-ink-500 mb-4">
              {pickup.status === 'delivered'
                ? 'This delivery is complete. Thank you!'
                : pickup.status === 'open'
                ? 'Accept this pickup to start the delivery.'
                : isMyPickup
                ? 'Update the status as you progress.'
                : 'This pickup is assigned to another volunteer.'}
            </p>

            {error && <div className="mb-3"><ErrorBanner message={error} /></div>}

            {volunteer && (
              <div className="rounded-xl bg-ink-50 p-3 mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-ink-400">Volunteer</p>
                  <p className="text-sm font-semibold text-ink-800">{volunteer.name}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {canAccept && (
                <button onClick={() => handleAction('accept')} disabled={actioning} className="btn-primary w-full">
                  {actioning ? 'Accepting…' : 'Accept Pickup'}
                </button>
              )}
              {canCollect && (
                <button onClick={() => handleAction('collect')} disabled={actioning} className="btn-primary w-full">
                  <Check className="h-4 w-4" />
                  {actioning ? 'Updating…' : 'Mark as Collected'}
                </button>
              )}
              {canDeliver && (
                <button onClick={() => handleAction('deliver')} disabled={actioning} className="btn-primary w-full">
                  <Check className="h-4 w-4" />
                  {actioning ? 'Updating…' : 'Mark as Delivered'}
                </button>
              )}
              {pickup.status === 'delivered' && (
                <div className="rounded-xl bg-brand-50 border border-brand-200 p-4 text-center">
                  <Check className="h-6 w-6 text-brand-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-brand-700">Delivery complete!</p>
                  <p className="text-xs text-brand-600 mt-0.5">Thank you for helping reduce food waste.</p>
                </div>
              )}
              {pickup.status === 'cancelled' && (
                <p className="text-sm text-ink-500 text-center">This pickup was cancelled.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
