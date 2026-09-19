import { useState, type FormEvent } from 'react';
import { ArrowLeft, Utensils, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, ErrorBanner } from '@/components/ui';
import { createListing } from '@/lib/listings';
import { locationPresets } from '@/pages/SignUpPage';
import type { PageId } from '@/components/AppLayout';

interface Props {
  onBack: () => void;
  onPosted: () => void;
}

const foodTypes = ['Veg', 'Non-Veg', 'Vegan', 'Mixed', 'Dessert', 'Bakery', 'Beverages'];

function toLocalDatetimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PostFoodPage({ onBack, onPosted }: Props) {
  const { profile } = useAuth();
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [foodType, setFoodType] = useState('Veg');
  const [preparedAt, setPreparedAt] = useState(toLocalDatetimeInput(new Date()));
  const [availableUntil, setAvailableUntil] = useState(
    toLocalDatetimeInput(new Date(Date.now() + 4 * 3600_000)),
  );
  const [pickupLocation, setPickupLocation] = useState(profile?.location_label ?? '');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!profile) return;
    const loc = locationPresets.find((l) => l.label === pickupLocation);
    if (!loc) {
      setError('Please select a valid pickup location.');
      return;
    }
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      setError('Quantity must be a positive number.');
      return;
    }
    setLoading(true);
    try {
      await createListing(profile.id, {
        food_name: foodName,
        quantity: qty,
        food_type: foodType,
        prepared_at: new Date(preparedAt).toISOString(),
        available_until: new Date(availableUntil).toISOString(),
        pickup_location_label: pickupLocation,
        pickup_lat: loc.lat,
        pickup_lng: loc.lng,
        additional_info: additionalInfo || undefined,
      });
      onPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={onBack} className="btn-ghost text-sm mb-2 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <PageHeader title="Post Surplus Food" subtitle="Share details about the food you have available." />

      <form onSubmit={handleSubmit} className="card p-6 max-w-2xl space-y-5">
        {error && <ErrorBanner message={error} />}

        <div>
          <label className="label">Food name</label>
          <div className="relative">
            <Utensils className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              required
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              className="input pl-10"
              placeholder="e.g. Vegetable Biryani, Sandwiches, Idli Sambar"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Quantity (portions)</label>
            <input
              required
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input"
              placeholder="e.g. 40"
            />
          </div>
          <div>
            <label className="label">Food type</label>
            <select value={foodType} onChange={(e) => setFoodType(e.target.value)} className="input">
              {foodTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Prepared time</label>
            <input
              required
              type="datetime-local"
              value={preparedAt}
              onChange={(e) => setPreparedAt(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Available until</label>
            <input
              required
              type="datetime-local"
              value={availableUntil}
              onChange={(e) => setAvailableUntil(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label">Pickup location</label>
          <select value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className="input" required>
            <option value="">Select pickup area…</option>
            {locationPresets.map((l) => (
              <option key={l.label} value={l.label}>{l.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">
            Additional information <span className="text-ink-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            rows={3}
            className="input resize-none"
            placeholder="Allergens, packaging, storage notes, contact preference…"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Posting…' : 'Post Listing'}
          </button>
          <button type="button" onClick={onBack} className="btn-secondary">Cancel</button>
        </div>

        <p className="text-xs text-ink-400 flex items-center gap-1.5 pt-1">
          <Check className="h-3 w-3 text-brand-500" />
          Your listing will be visible to NGOs nearby and matched by distance, quantity, and urgency.
        </p>
      </form>
    </div>
  );
}
