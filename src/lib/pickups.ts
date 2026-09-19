import { supabase } from './supabase';
import { haversineKm } from './geo';
import type { Pickup, Profile, FoodListing } from './types';

export async function fetchOpenPickups(): Promise<Pickup[]> {
  const { data, error } = await supabase
    .from('pickups')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Pickup[]) ?? [];
}

export async function fetchVolunteerPickups(volunteerId: string): Promise<Pickup[]> {
  const { data, error } = await supabase
    .from('pickups')
    .select('*')
    .eq('volunteer_id', volunteerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Pickup[]) ?? [];
}

export async function fetchPickupById(id: string): Promise<Pickup | null> {
  const { data, error } = await supabase.from('pickups').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Pickup | null;
}

export async function fetchProfilesByIds(ids: string[]): Promise<Record<string, Profile>> {
  if (ids.length === 0) return {};
  const { data, error } = await supabase.from('profiles').select('*').in('id', ids);
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

export async function acceptPickup(pickupId: string, volunteerId: string): Promise<void> {
  const { error } = await supabase
    .from('pickups')
    .update({ volunteer_id: volunteerId, status: 'assigned' })
    .eq('id', pickupId)
    .eq('status', 'open');
  if (error) throw error;
   
  // Update listing to PICKUP_ASSIGNED
  const { data: pickup, error: pErr } = await supabase
    .from('pickups')
    .select('listing_id')
    .eq('id', pickupId)
    .maybeSingle();
  if (pErr) throw pErr;
  if (pickup) {
    await supabase
      .from('food_listings')
      .update({ status: 'PICKUP_ASSIGNED' })
      .eq('id', (pickup as { listing_id: string }).listing_id);
  }
}

export async function markCollected(pickupId: string): Promise<void> {
  const { error } = await supabase
    .from('pickups')
    .update({ status: 'collected' })
    .eq('id', pickupId);
  if (error) throw error;

  const { data: pickup, error: pErr } = await supabase
    .from('pickups')
    .select('listing_id')
    .eq('id', pickupId)
    .maybeSingle();
  if (pErr) throw pErr;
  if (pickup) {
    await supabase
      .from('food_listings')
      .update({ status: 'PICKED_UP' })
      .eq('id', (pickup as { listing_id: string }).listing_id);
  }
}

export async function markDelivered(pickupId: string): Promise<void> {
  const { error } = await supabase
    .from('pickups')
    .update({ status: 'delivered' })
    .eq('id', pickupId);
  if (error) throw error;

  const { data: pickup, error: pErr } = await supabase
    .from('pickups')
    .select('listing_id, distance_km')
    .eq('id', pickupId)
    .maybeSingle();
  if (pErr) throw pErr;
  if (pickup) {
    await supabase
      .from('food_listings')
      .update({ status: 'COMPLETED' })
      .eq('id', (pickup as { listing_id: string }).listing_id);
  }
}

export function pickupDistance(p: Pickup): number {
  return haversineKm(p.pickup_lat, p.pickup_lng, p.drop_lat, p.drop_lng);
}
