import type { ListingStatus, RequestStatus, PickupStatus } from '@/lib/types';

const listingStyles: Record<ListingStatus, { cls: string; label: string }> = {
  AVAILABLE: { cls: 'bg-brand-100 text-brand-700', label: 'Available' },
  REQUESTED: { cls: 'bg-amber-100 text-amber-700', label: 'Requested' },
  ACCEPTED: { cls: 'bg-blue-100 text-blue-700', label: 'Accepted' },
  PICKUP_ASSIGNED: { cls: 'bg-violet-100 text-violet-700', label: 'Pickup Assigned' },
  PICKED_UP: { cls: 'bg-indigo-100 text-indigo-700', label: 'Picked Up' },
  COMPLETED: { cls: 'bg-brand-600 text-white', label: 'Completed' },
  CANCELLED: { cls: 'bg-ink-200 text-ink-600', label: 'Cancelled' },
};

const requestStyles: Record<RequestStatus, { cls: string; label: string }> = {
  pending: { cls: 'bg-amber-100 text-amber-700', label: 'Pending' },
  accepted: { cls: 'bg-brand-100 text-brand-700', label: 'Accepted' },
  rejected: { cls: 'bg-ink-200 text-ink-600', label: 'Rejected' },
};

const pickupStyles: Record<PickupStatus, { cls: string; label: string }> = {
  open: { cls: 'bg-amber-100 text-amber-700', label: 'Open' },
  assigned: { cls: 'bg-blue-100 text-blue-700', label: 'Assigned' },
  collected: { cls: 'bg-indigo-100 text-indigo-700', label: 'Collected' },
  delivered: { cls: 'bg-brand-600 text-white', label: 'Delivered' },
  cancelled: { cls: 'bg-ink-200 text-ink-600', label: 'Cancelled' },
};

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const s = listingStyles[status];
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const s = requestStyles[status];
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export function PickupStatusBadge({ status }: { status: PickupStatus }) {
  const s = pickupStyles[status];
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}
