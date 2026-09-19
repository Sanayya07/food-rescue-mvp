import { useEffect, useState, useMemo } from 'react';
import { Search, Package, HeartHandshake } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, EmptyState, Spinner } from '@/components/ui';
import { FoodCard } from '@/components/FoodCard';
import { fetchAvailableListings, fetchProviderProfile } from '@/lib/listings';
import { haversineKm } from '@/lib/geo';
import { computeMatch } from '@/lib/matching';
import type { FoodListing, Profile, MatchLevel } from '@/lib/types';

interface Props {
  onSelectListing: (id: string) => void;
}

interface EnrichedListing extends FoodListing {
  distanceKm: number;
  match: { level: MatchLevel; reason: string };
}

export function NgoDashboard({ onSelectListing }: Props) {
  const { profile } = useAuth();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [providers, setProviders] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'match' | 'distance' | 'urgent'>('match');

  useEffect(() => {
    if (!profile) return;
    fetchAvailableListings()
      .then(async (data) => {
        setListings(data);
        const providerIds = [...new Set(data.map((l) => l.provider_id))];
        const map: Record<string, Profile> = {};
        await Promise.all(
          providerIds.map(async (id) => {
            const p = await fetchProviderProfile(id);
            if (p) map[id] = p;
          }),
        );
        setProviders(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profile]);

  const enriched: EnrichedListing[] = useMemo(() => {
    if (!profile?.location_lat || !profile?.location_lng) return [];
    return listings
      .filter((l) => new Date(l.available_until).getTime() > Date.now())
      .map((l) => {
        const distanceKm = haversineKm(l.pickup_lat, l.pickup_lng, profile.location_lat!, profile.location_lng!);
        const match = computeMatch({
          distanceKm,
          availableQty: l.quantity,
          availableUntil: l.available_until,
        });
        return { ...l, distanceKm, match };
      });
  }, [listings, profile]);

  const filtered = useMemo(() => {
    let result = enriched;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.food_name.toLowerCase().includes(q) ||
          l.food_type.toLowerCase().includes(q) ||
          l.pickup_location_label.toLowerCase().includes(q),
      );
    }
    if (sort === 'match') {
      const order = { good: 0, moderate: 1, low: 2 };
      result = [...result].sort((a, b) => order[a.match.level] - order[b.match.level]);
    } else if (sort === 'distance') {
      result = [...result].sort((a, b) => a.distanceKm - b.distanceKm);
    } else {
      result = [...result].sort(
        (a, b) => new Date(a.available_until).getTime() - new Date(b.available_until).getTime(),
      );
    }
    return result;
  }, [enriched, search, sort]);

  return (
    <div>
      <PageHeader
        title={`Hello, ${profile?.name?.split(' ')[0] ?? 'there'}`}
        subtitle="Available surplus food near you, matched by distance and urgency."
      />

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            placeholder="Search by food name, type, or area…"
          />
        </div>
        <div className="flex gap-2">
          {([
            { id: 'match', label: 'Best match' },
            { id: 'distance', label: 'Nearest' },
            { id: 'urgent', label: 'Most urgent' },
          ] as const).map((s) => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition ${
                sort === s.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner label="Finding food near you…" />
      ) : !profile?.location_lat ? (
        <EmptyState
          icon={<HeartHandshake className="h-6 w-6" />}
          title="Set your location in Profile"
          description="We need your location to find food near you and calculate distances."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="No food available right now"
          description="Check back soon — new surplus food listings appear throughout the day."
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((l) => (
            <FoodCard
              key={l.id}
              listing={l}
              distanceKm={l.distanceKm}
              match={l.match}
              onClick={() => onSelectListing(l.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
