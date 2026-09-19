import { supabase } from './supabase';
import type { Profile, Role } from './types';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function createProfile(
  userId: string,
  role: Role,
  name: string,
  orgName: string | null,
  phone: string | null,
  locationLabel: string | null,
  lat: number | null,
  lng: number | null,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      role,
      name,
      org_name: orgName,
      phone,
      location_label: locationLabel,
      location_lat: lat,
      location_lng: lng,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<Profile, 'name' | 'org_name' | 'phone' | 'location_label' | 'location_lat' | 'location_lng'>>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}
