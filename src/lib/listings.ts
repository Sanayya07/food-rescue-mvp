import { supabase } from './supabase';
import type { FoodListing, Profile } from './types';

export interface NewListingInput {
  food_name: string;
  quantity: number;
  food_type: string;
  prepared_at: string;
  available_until: string;
  pickup_location_label: string;
  pickup_lat: number;
  pickup_lng: number;
  additional_info?: string;
}

export async function createListing(providerId: string, input: NewListingInput): Promise<FoodListing> {
  const { data, error } = await supabase
    .from('food_listings')
    .insert({ ...input, provider_id: providerId })
    .select()
    .single();
  if (error) throw error;
  return data as FoodListing;
}

export async function fetchProviderListings(providerId: string): Promise<FoodListing[]> {
  const { data, error } = await supabase
    .from('food_listings')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as FoodListing[]) ?? [];
}

export async function fetchListingById(id: string): Promise<FoodListing | null> {
  const { data, error } = await supabase
    .from('food_listings')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as FoodListing | null;
}

export async function fetchProviderProfile(providerId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', providerId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function fetchAvailableListings(): Promise<FoodListing[]> {
  const { data, error } = await supabase
    .from('food_listings')
    .select('*')
    .in('status', ['AVAILABLE', 'REQUESTED'])
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as FoodListing[]) ?? [];
}

export async function updateListingStatus(listingId: string, status: FoodListing['status']): Promise<void> {
  const { error } = await supabase
    .from('food_listings')
    .update({ status })
    .eq('id', listingId);
  if (error) throw error;
}
