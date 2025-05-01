export interface MarketComp {
  id: string;
  property_type: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  zipcode: string;
  price: number | null;
  rent: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  created_at: string;
  source: string;
}

export interface MarketCompSearchParams {
  property_type?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  min_price?: number;
  max_price?: number;
  min_rent?: number;
  max_rent?: number;
  min_beds?: number;
  max_beds?: number;
  min_baths?: number;
  max_baths?: number;
  min_sqft?: number;
  max_sqft?: number;
  bounding_box?: {
    southwest: { lat: number; lng: number };
    northeast: { lat: number; lng: number };
  };
  center_point?: { lat: number; lng: number };
  radius_miles?: number;
}
