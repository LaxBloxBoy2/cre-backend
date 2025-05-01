'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { MarketComp } from '@/types/marketComp';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface CompsParams {
  lat?: number;
  lng?: number;
  radius?: number;
  propertyType?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}

// Demo data for development and fallback
const DEMO_COMPS: MarketComp[] = [
  {
    id: '1',
    property_type: 'Multifamily',
    latitude: 32.715736,
    longitude: -117.161087,
    city: 'San Diego',
    state: 'CA',
    zipcode: '92101',
    price: 5000000,
    rent: 2500,
    beds: 2,
    baths: 2,
    sqft: 1200,
    created_at: new Date().toISOString(),
    source: 'LoopNet'
  },
  {
    id: '2',
    property_type: 'Office',
    latitude: 32.712, 
    longitude: -117.157,
    city: 'San Diego',
    state: 'CA',
    zipcode: '92101',
    price: 8500000,
    rent: null,
    beds: null,
    baths: null,
    sqft: 5000,
    created_at: new Date().toISOString(),
    source: 'LoopNet'
  },
  {
    id: '3',
    property_type: 'Retail',
    latitude: 32.719,
    longitude: -117.165,
    city: 'San Diego',
    state: 'CA',
    zipcode: '92101',
    price: 3200000,
    rent: null,
    beds: null,
    baths: null,
    sqft: 2800,
    created_at: new Date().toISOString(),
    source: 'LoopNet'
  },
  {
    id: '4',
    property_type: 'Multifamily',
    latitude: 32.722,
    longitude: -117.169,
    city: 'San Diego',
    state: 'CA',
    zipcode: '92103',
    price: 6700000,
    rent: 3200,
    beds: 3,
    baths: 2,
    sqft: 1800,
    created_at: new Date().toISOString(),
    source: 'LoopNet'
  },
  {
    id: '5',
    property_type: 'Industrial',
    latitude: 32.705,
    longitude: -117.152,
    city: 'San Diego',
    state: 'CA',
    zipcode: '92102',
    price: 4100000,
    rent: null,
    beds: null,
    baths: null,
    sqft: 12000,
    created_at: new Date().toISOString(),
    source: 'LoopNet'
  }
];

export function useComps(params: CompsParams = {}) {
  const { lat, lng, radius, propertyType, city, state, zipcode } = params;

  return useQuery({
    queryKey: ['comps', lat, lng, radius, propertyType, city, state, zipcode],
    queryFn: async () => {
      // Check if we're using demo token - if so, return demo data immediately
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token === 'demo_access_token') {
          console.log('Using demo token - returning demo comps data');
          return DEMO_COMPS;
        }
      }

      try {
        // Build query parameters
        const queryParams = new URLSearchParams();
        if (lat !== undefined) queryParams.append('lat', lat.toString());
        if (lng !== undefined) queryParams.append('lng', lng.toString());
        if (radius !== undefined) queryParams.append('radius', radius.toString());
        if (propertyType) queryParams.append('property_type', propertyType);
        if (city) queryParams.append('city', city);
        if (state) queryParams.append('state', state);
        if (zipcode) queryParams.append('zipcode', zipcode);

        // Make API request
        const response = await axios.get(`${API_URL}/api/comps?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        return response.data.comps;
      } catch (error) {
        console.error('Error fetching comps:', error);
        
        // Return demo data as fallback
        return DEMO_COMPS;
      }
    },
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
}
