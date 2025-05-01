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
