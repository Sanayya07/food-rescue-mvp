import { MapPin, Clock, Package, Utensils } from 'lucide-react';
import type { FoodListing, MatchLevel } from '@/lib/types';
import { formatDistance } from '@/lib/geo';
import { timeRemaining, formatDateTime } from '@/lib/format';
import { ListingStatusBadge } from './StatusBadge';
import { MatchBadge } from './MatchBadge';

interface Props {
  listing: FoodListing;
  distanceKm?: number;
  match?: { level: MatchLevel; reason: string };
  onClick?: () => void;
  ctaLabel?: string;
  showExpiredStatus?: boolean;
  onCancel?: () => void;
  cancelLoading?: boolean;
}

const foodTypeEmoji: Record<string, string> = {
  Veg: '🥗',
  'Non-Veg': '🍗',
  Vegan: '🌱',
  Mixed: '🍱',
  Dessert: '🍰',
  Bakery: '🥖',
  Beverages: '🥤',
};

export function FoodCard({ listing, distanceKm, match, onClick, ctaLabel = 'View Details', showExpiredStatus = false, onCancel, cancelLoading = false }: Props) {
  const expired = new Date(listing.available_until).getTime() < Date.now();
  const emoji = foodTypeEmoji[listing.food_type] ?? '🍱';

  return (
    <div
      onClick={onClick}
      className={`card p-5 transition-all duration-200 hover:shadow-cardHover hover:-translate-y-0.5 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">
            {emoji}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-ink-900 truncate">{listing.food_name}</h3>
            <p className="text-xs text-ink-500 flex items-center gap-1">
              <Utensils className="h-3 w-3" />
              {listing.food_type}
            </p>
          </div>
        </div>
        {expired && showExpiredStatus ? (
          <span className="badge bg-red-100 text-red-700">Expired</span>
        ) : (
          <ListingStatusBadge status={listing.status} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-y-2.5 gap-x-3 text-sm mb-4">
        <div className="flex items-center gap-2 text-ink-600">
          <Package className="h-4 w-4 text-ink-400" />
          <span className="font-medium text-ink-800">{listing.quantity}</span> portions
        </div>
        <div className="flex items-center gap-2 text-ink-600">
          <MapPin className="h-4 w-4 text-ink-400" />
          {formatDistance(distanceKm)}
        </div>
        <div className="flex items-center gap-2 text-ink-600 col-span-2">
          <Clock className="h-4 w-4 text-ink-400" />
          <span className={expired ? 'text-red-600 font-medium' : ''}>
            {expired ? 'Expired' : timeRemaining(listing.available_until)}
          </span>
          <span className="text-ink-400 text-xs">· {formatDateTime(listing.available_until)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-ink-100">
        {match ? (
          <MatchBadge level={match.level} reason={match.reason} />
        ) : (
          <span className="text-xs text-ink-400 truncate">{listing.pickup_location_label}</span>
        )}
        <div className="flex items-center gap-3 shrink-0">
          {onCancel && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onCancel();
              }}
              disabled={cancelLoading}
              className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              {cancelLoading ? 'Cancelling...' : 'Cancel'}
            </button>
          )}
          {onClick && <span className="text-sm font-semibold text-brand-600">{ctaLabel} →</span>}
        </div>
      </div>
    </div>
  );
}
