import { supabase } from './supabase';
import type { FoodRequest, FoodListing, Profile, Pickup } from './types';

export async function createRequest(
  listingId: string,
  ngoId: string,
  requestedQuantity: number,
  dropLocationLabel: string,
  dropLat: number,
  dropLng: number,
): Promise<FoodRequest> {
  const { data, error } = await supabase
    .from('requests')
    .insert({
      listing_id: listingId,
      ngo_id: ngoId,
      requested_quantity: requestedQuantity,
    })
    .select()
    .single();
  if (error) throw error;

  // Update listing status to REQUESTED
  await supabase.from('food_listings').update({ status: 'REQUESTED' }).eq('id', listingId);

  return data as FoodRequest;
}

export async function fetchRequestsForListing(listingId: string): Promise<FoodRequest[]> {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as FoodRequest[]) ?? [];
}

export async function fetchRequestsForProvider(providerId: string): Promise<FoodRequest[]> {
  // Get listings for this provider, then requests for those listings
  const { data: listings, error: lErr } = await supabase
    .from('food_listings')
    .select('id')
    .eq('provider_id', providerId);
  if (lErr) throw lErr;
  const ids = (listings ?? []).map((l) => l.id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .in('listing_id', ids)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as FoodRequest[]) ?? [];
}

export async function fetchRequestsForNgo(ngoId: string): Promise<FoodRequest[]> {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('ngo_id', ngoId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as FoodRequest[]) ?? [];
}

export async function fetchNgoProfiles(ngoIds: string[]): Promise<Record<string, Profile>> {
  if (ngoIds.length === 0) return {};
  const { data, error } = await supabase.from('profiles').select('*').in('id', ngoIds);
  if (error) throw error;
  const map: Record<string, Profile> = {};
  (data as Profile[] ?? []).forEach((p) => (map[p.id] = p));
  return map;
}

export async function fetchListingsByIds(ids: string[]): Promise<Record<string, FoodListing>> {
  if (ids.length === 0) return {};
  const { data, error } = await supabase.from('food_listings').select('*').in('id', ids);
  if (error) throw error;
  const map: Record<string, FoodListing> = {};
  (data as FoodListing[] ?? []).forEach((l) => (map[l.id] = l));
  return map;
}

export async function acceptRequest(
  request: FoodRequest,
  listing: FoodListing,
  ngo: Profile,
): Promise<Pickup> {
  // 1. Update request status to accepted
  const { error: rErr } = await supabase
    .from('requests')
    .update({ status: 'accepted' })
    .eq('id', request.id);
  if (rErr) throw rErr;

  // 2. Reject all other pending requests for this listing
  await supabase
    .from('requests')
    .update({ status: 'rejected' })
    .eq('listing_id', request.listing_id)
    .neq('id', request.id)
    .eq('status', 'pending');

  // 3. Update listing status to ACCEPTED
  await supabase.from('food_listings').update({ status: 'ACCEPTED' }).eq('id', listing.id);

  // 4. Create a pickup task (open for volunteers)
  const requiredBy = new Date(listing.available_until).toISOString();
  const { data: pickup, error: pErr } = await supabase
    .from('pickups')
    .insert({
      request_id: request.id,
      listing_id: listing.id,
      provider_id: listing.provider_id,
      ngo_id: request.ngo_id,
      food_name: listing.food_name,
      quantity: request.requested_quantity,
      pickup_location_label: listing.pickup_location_label,
      pickup_lat: listing.pickup_lat,
      pickup_lng: listing.pickup_lng,
      drop_location_label: ngo.location_label ?? 'NGO location',
      drop_lat: ngo.location_lat ?? 0,
      drop_lng: ngo.location_lng ?? 0,
      distance_km: 0,
      required_by: requiredBy,
      status: 'open',
    })
    .select()
    .single();
  if (pErr) throw pErr;
  return pickup as Pickup;
}

export async function rejectRequest(requestId: string): Promise<void> {
  const { error } = await supabase.from('requests').update({ status: 'rejected' }).eq('id', requestId);
  if (error) throw error;
}
