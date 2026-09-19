export type Role = 'provider' | 'ngo' | 'volunteer';

export type ListingStatus =
  | 'AVAILABLE'
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'PICKUP_ASSIGNED'
  | 'PICKED_UP'
  | 'COMPLETED'
  | 'CANCELLED';

export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export type PickupStatus = 'open' | 'assigned' | 'collected' | 'delivered' | 'cancelled';

export type MatchLevel = 'good' | 'moderate' | 'low';

export interface Profile {
  id: string;
  role: Role;
  name: string;
  org_name: string | null;
  phone: string | null;
  location_label: string | null;
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
}

export interface FoodListing {
  id: string;
  provider_id: string;
  food_name: string;
  quantity: number;
  food_type: string;
  prepared_at: string;
  available_until: string;
  pickup_location_label: string;
  pickup_lat: number;
  pickup_lng: number;
  additional_info: string | null;
  status: ListingStatus;
  created_at: string;
  provider?: Profile;
}

export interface FoodRequest {
  id: string;
  listing_id: string;
  ngo_id: string;
  requested_quantity: number;
  status: RequestStatus;
  created_at: string;
  ngo?: Profile;
  listing?: FoodListing;
}

export interface Pickup {
  id: string;
  request_id: string;
  listing_id: string;
  provider_id: string;
  ngo_id: string;
  volunteer_id: string | null;
  food_name: string;
  quantity: number;
  pickup_location_label: string;
  pickup_lat: number;
  pickup_lng: number;
  drop_location_label: string;
  drop_lat: number;
  drop_lng: number;
  distance_km: number;
  required_by: string;
  status: PickupStatus;
  created_at: string;
  provider?: Profile;
  ngo?: Profile;
  volunteer?: Profile | null;
}

export interface FoodListingWithDistance extends FoodListing {
  distanceKm?: number;
  match?: MatchLevel;
}
