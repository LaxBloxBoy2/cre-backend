import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface UseCompsParams {
  lat: number;
  lng: number;
  radius: number;
  propertyType?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}

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

export function useComps({
  lat,
  lng,
  radius,
  propertyType,
  city,
  state,
  zipcode,
}: UseCompsParams) {
  const [comps, setComps] = useState<MarketComp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  const fetchComps = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (lat) params.append('lat', lat.toString());
      if (lng) params.append('lng', lng.toString());
      if (radius) params.append('radius', radius.toString());
      if (propertyType) params.append('property_type', propertyType);
      if (city) params.append('city', city);
      if (state) params.append('state', state);
      if (zipcode) params.append('zipcode', zipcode);

      // Create an abort controller for the request
      const controller = new AbortController();

      // Set a timeout of 10 seconds for the request
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('Comps API request timed out, using fallback data');
      }, 10000);

      // Make API request with the abort signal
      const response = await api.get(`/api/comps?${params.toString()}`, {
        signal: controller.signal
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      // Check if we got a valid response
      if (response.data && response.data.comps) {
        setComps(response.data.comps);
        setTotal(response.data.total || response.data.comps.length);
      } else {
        // Fallback to demo data if API fails
        console.warn('API returned invalid data, using fallback data');

        // Generate fallback data
        const fallbackComps = generateFallbackComps(lat, lng);
        setComps(fallbackComps);
        setTotal(fallbackComps.length);
      }
    } catch (err) {
      console.error('Error fetching comps:', err);
      setError(err instanceof Error ? err : new Error(String(err)));

      // Fallback to demo data if API fails
      console.warn('API request failed, using fallback data');
      const fallbackComps = generateFallbackComps(lat, lng);
      setComps(fallbackComps);
      setTotal(fallbackComps.length);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to generate fallback data if API fails
  const generateFallbackComps = (centerLat: number, centerLng: number): MarketComp[] => {
    // Generate 10 random properties around the center point
    const fallbackComps: MarketComp[] = [];
    const propertyTypes = ['Multifamily', 'Office', 'Retail', 'Industrial'];

    for (let i = 0; i < 10; i++) {
      // Random offset within about 5 miles
      const latOffset = (Math.random() - 0.5) * 0.1;
      const lngOffset = (Math.random() - 0.5) * 0.1;

      const propType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];

      fallbackComps.push({
        id: `fallback-${i}`,
        property_type: propType,
        latitude: centerLat + latOffset,
        longitude: centerLng + lngOffset,
        city: 'San Diego',
        state: 'CA',
        zipcode: '92101',
        price: propType === 'Multifamily' ? 5000000 + Math.floor(Math.random() * 5000000) :
               propType === 'Office' ? 8000000 + Math.floor(Math.random() * 10000000) :
               propType === 'Retail' ? 3000000 + Math.floor(Math.random() * 5000000) :
               4000000 + Math.floor(Math.random() * 15000000),
        rent: propType === 'Multifamily' ? 2000 + Math.floor(Math.random() * 3000) : null,
        beds: propType === 'Multifamily' ? 1 + Math.floor(Math.random() * 3) : null,
        baths: propType === 'Multifamily' ? 1 + Math.floor(Math.random() * 3) : null,
        sqft: propType === 'Multifamily' ? 800 + Math.floor(Math.random() * 2000) :
              propType === 'Office' ? 3000 + Math.floor(Math.random() * 10000) :
              propType === 'Retail' ? 2000 + Math.floor(Math.random() * 8000) :
              10000 + Math.floor(Math.random() * 30000),
        created_at: new Date().toISOString(),
        source: 'Fallback Data'
      });
    }

    return fallbackComps;
  };

  // Fetch comps when params change
  useEffect(() => {
    fetchComps();
  }, [lat, lng, radius, propertyType, city, state, zipcode]);

  return {
    comps,
    isLoading,
    error,
    total,
    refetch: fetchComps,
  };
}
