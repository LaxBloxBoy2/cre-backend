import { apiClient } from './client';

// Types
export interface PropertyTypeDistribution {
  name: string;
  value: number;
  percentage: number;
  count: number;
}

export interface LeaseExpirationTimeline {
  period: string;
  year: number;
  quarter: number;
  count: number;
  rent: number;
  area: number;
  timestamp: number;
}

export interface TenantConcentration {
  id: string;
  name: string;
  rent: number;
  percentage: number;
}

export interface RentRollSummary {
  total_monthly_rent: number;
  total_leased_area: number;
  average_rent_per_sqft: number;
  active_leases_count: number;
  expiring_within_90_days: number;
  expiring_within_year: number;
  occupancy_rate: number;
  top_property_type: string;
  top_property_type_percentage: number;
}

export interface RentRollSettings {
  integrate_with_deals: boolean;
  integrate_with_documents: boolean;
  integrate_with_calendar: boolean;
}

// API functions
export async function getRentRollSummary(assetId?: string): Promise<RentRollSummary> {
  console.log('Fetching rent roll summary...');

  // Check if we're in development mode or if the backend is not deployed
  if (process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_API_URL) {
    console.log('Development mode or no API URL set - using mock data');
    const mockData = {
      total_monthly_rent: 125000,
      total_leased_area: 75000,
      average_rent_per_sqft: 20,
      active_leases_count: 12,
      expiring_within_90_days: 2,
      expiring_within_year: 5,
      occupancy_rate: 85,
      top_property_type: 'Office',
      top_property_type_percentage: 45
    };
    console.log('Using mock data:', mockData);
    return mockData;
  }

  try {
    const params = assetId ? { asset_id: assetId } : {};
    console.log('API request to /rent-roll/summary with params:', params);
    const response = await apiClient.get('/rent-roll/summary', { params });
    console.log('API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching rent roll summary:', error);

    // Return mock data for demo
    const mockData = {
      total_monthly_rent: 125000,
      total_leased_area: 75000,
      average_rent_per_sqft: 20,
      active_leases_count: 12,
      expiring_within_90_days: 2,
      expiring_within_year: 5,
      occupancy_rate: 85,
      top_property_type: 'Office',
      top_property_type_percentage: 45
    };
    console.log('Using mock data:', mockData);
    return mockData;
  }
}

export async function getPropertyTypeDistribution(assetId?: string): Promise<PropertyTypeDistribution[]> {
  console.log('Fetching property type distribution...');

  // Check if we're in development mode or if the backend is not deployed
  if (process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_API_URL) {
    console.log('Development mode or no API URL set - using mock data');
    const mockData = [
      { name: 'Office', value: 75000, percentage: 45, count: 5 },
      { name: 'Retail', value: 50000, percentage: 30, count: 4 },
      { name: 'Industrial', value: 25000, percentage: 15, count: 2 },
      { name: 'Multifamily', value: 15000, percentage: 9, count: 1 },
      { name: 'Mixed-Use', value: 1000, percentage: 1, count: 1 }
    ];
    console.log('Using mock data:', mockData);
    return mockData;
  }

  try {
    const params = assetId ? { asset_id: assetId } : {};
    console.log('API request to /rent-roll/property-type-distribution with params:', params);
    const response = await apiClient.get('/rent-roll/property-type-distribution', { params });
    console.log('API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching property type distribution:', error);

    // Return mock data for demo
    const mockData = [
      { name: 'Office', value: 75000, percentage: 45, count: 5 },
      { name: 'Retail', value: 50000, percentage: 30, count: 4 },
      { name: 'Industrial', value: 25000, percentage: 15, count: 2 },
      { name: 'Multifamily', value: 15000, percentage: 9, count: 1 },
      { name: 'Mixed-Use', value: 1000, percentage: 1, count: 1 }
    ];
    console.log('Using mock data:', mockData);
    return mockData;
  }
}

export async function getLeaseExpirationTimeline(assetId?: string, yearsAhead: number = 5): Promise<LeaseExpirationTimeline[]> {
  console.log('Fetching lease expiration timeline...');

  // Check if we're in development mode or if the backend is not deployed
  if (process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_API_URL) {
    console.log('Development mode or no API URL set - using mock data');
    const now = new Date();
    const mockData: LeaseExpirationTimeline[] = [];

    for (let i = 0; i < 8; i++) {
      const year = now.getFullYear() + Math.floor(i / 4);
      const quarter = (i % 4) + 1;
      const date = new Date(year, (quarter - 1) * 3, 1);

      mockData.push({
        period: `${year} Q${quarter}`,
        year,
        quarter,
        count: Math.floor(Math.random() * 5) + 1,
        rent: Math.floor(Math.random() * 50000) + 10000,
        area: Math.floor(Math.random() * 20000) + 5000,
        timestamp: date.getTime()
      });
    }

    console.log('Using mock data:', mockData);
    return mockData;
  }

  try {
    const params = {
      ...(assetId ? { asset_id: assetId } : {}),
      years_ahead: yearsAhead
    };
    console.log('API request to /rent-roll/lease-expiration-timeline with params:', params);
    const response = await apiClient.get('/rent-roll/lease-expiration-timeline', { params });
    console.log('API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching lease expiration timeline:', error);

    // Return mock data for demo
    const now = new Date();
    const mockData: LeaseExpirationTimeline[] = [];

    for (let i = 0; i < 8; i++) {
      const year = now.getFullYear() + Math.floor(i / 4);
      const quarter = (i % 4) + 1;
      const date = new Date(year, (quarter - 1) * 3, 1);

      mockData.push({
        period: `${year} Q${quarter}`,
        year,
        quarter,
        count: Math.floor(Math.random() * 5) + 1,
        rent: Math.floor(Math.random() * 50000) + 10000,
        area: Math.floor(Math.random() * 20000) + 5000,
        timestamp: date.getTime()
      });
    }

    console.log('Using mock data:', mockData);
    return mockData;
  }
}

export async function getTenantConcentration(assetId?: string, topN: number = 5): Promise<TenantConcentration[]> {
  console.log('Fetching tenant concentration...');

  // Check if we're in development mode or if the backend is not deployed
  if (process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_API_URL) {
    console.log('Development mode or no API URL set - using mock data');
    const mockData = [
      { id: '1', name: 'Acme Corp', rent: 35000, percentage: 28 },
      { id: '2', name: 'TechStart Inc', rent: 25000, percentage: 20 },
      { id: '3', name: 'Global Services', rent: 20000, percentage: 16 },
      { id: '4', name: 'Local Retail', rent: 15000, percentage: 12 },
      { id: '5', name: 'Medical Group', rent: 10000, percentage: 8 },
      { id: 'others', name: 'Others', rent: 20000, percentage: 16 }
    ];
    console.log('Using mock data:', mockData);
    return mockData;
  }

  try {
    const params = {
      ...(assetId ? { asset_id: assetId } : {}),
      top_n: topN
    };
    console.log('API request to /rent-roll/tenant-concentration with params:', params);
    const response = await apiClient.get('/rent-roll/tenant-concentration', { params });
    console.log('API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching tenant concentration:', error);

    // Return mock data for demo
    const mockData = [
      { id: '1', name: 'Acme Corp', rent: 35000, percentage: 28 },
      { id: '2', name: 'TechStart Inc', rent: 25000, percentage: 20 },
      { id: '3', name: 'Global Services', rent: 20000, percentage: 16 },
      { id: '4', name: 'Local Retail', rent: 15000, percentage: 12 },
      { id: '5', name: 'Medical Group', rent: 10000, percentage: 8 },
      { id: 'others', name: 'Others', rent: 20000, percentage: 16 }
    ];
    console.log('Using mock data:', mockData);
    return mockData;
  }
}

export async function getRentRollSettings(): Promise<RentRollSettings> {
  console.log('Fetching rent roll settings...');

  // Check if we're in development mode or if the backend is not deployed
  if (process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_API_URL) {
    console.log('Development mode or no API URL set - using mock data');
    const mockData = {
      integrate_with_deals: true,
      integrate_with_documents: true,
      integrate_with_calendar: true
    };
    console.log('Using mock data:', mockData);
    return mockData;
  }

  try {
    console.log('API request to /rent-roll/settings');
    const response = await apiClient.get('/rent-roll/settings');
    console.log('API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching rent roll settings:', error);

    // Return mock data for demo
    const mockData = {
      integrate_with_deals: true,
      integrate_with_documents: true,
      integrate_with_calendar: true
    };
    console.log('Using mock data:', mockData);
    return mockData;
  }
}

export async function updateRentRollSettings(settings: RentRollSettings): Promise<RentRollSettings> {
  console.log('Updating rent roll settings:', settings);

  // Check if we're in development mode or if the backend is not deployed
  if (process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_API_URL) {
    console.log('Development mode or no API URL set - simulating update');
    console.log('Settings updated (simulated):', settings);
    return settings;
  }

  try {
    console.log('API request to /rent-roll/settings');
    const response = await apiClient.put('/rent-roll/settings', settings);
    console.log('API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating rent roll settings:', error);

    // Return the settings that were passed in
    console.log('Returning original settings due to error');
    return settings;
  }
}
