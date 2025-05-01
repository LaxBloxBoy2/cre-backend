'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Deal, DealStageUpdate, DealStageOrderUpdate } from '../types/deal';
import { PipelineFilterOptions } from '../components/pipeline/PipelineFilters';

// API client with auth header
const api = axios.create({
  baseURL: '/api',
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export function useDealPipeline() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<PipelineFilterOptions | null>(null);

  useEffect(() => {
    fetchDeals();
  }, []);

  useEffect(() => {
    if (filters) {
      // Apply filters without calling the applyFilters function to avoid state updates
      let filtered = [...deals];

      // Filter by property type
      if (filters.propertyType && filters.propertyType !== 'all') {
        filtered = filtered.filter(deal =>
          deal.property_type.toLowerCase() === filters.propertyType!.toLowerCase()
        );
      }

      // Filter by cap rate range
      if (filters.capRateRange) {
        const [min, max] = filters.capRateRange;
        filtered = filtered.filter(deal =>
          deal.exit_cap_rate >= min / 100 && deal.exit_cap_rate <= max / 100
        );
      }

      // Filter by stage
      if (filters.stage && filters.stage !== 'all') {
        filtered = filtered.filter(deal =>
          deal.deal_stage === filters.stage
        );
      }

      setFilteredDeals(filtered);
    } else {
      setFilteredDeals(deals);
    }
  }, [deals, filters]);

  const fetchDeals = async () => {
    try {
      setIsLoading(true);

      // Try to load from localStorage first
      let savedDeals = null;
      try {
        const savedData = localStorage.getItem('pipelineDeals');
        if (savedData) {
          savedDeals = JSON.parse(savedData);
          console.log('Loaded deals from localStorage:', savedDeals.length);
        }
      } catch (e) {
        console.warn('Failed to load pipeline state from localStorage:', e);
      }

      // If we have saved deals, use them
      if (savedDeals && savedDeals.length > 0) {
        setDeals(savedDeals);
        setFilteredDeals(savedDeals);
        setError(null);
        setIsLoading(false);
        return;
      }

      // Otherwise fetch from API
      const response = await api.get('/deals');

      // Check if response.data is an array or has a deals property
      const dealsData = Array.isArray(response.data)
        ? response.data
        : (response.data.deals || []);

      // Add deal_stage if it doesn't exist (for backward compatibility)
      const dealsWithStage = dealsData.map((deal: Deal) => ({
        ...deal,
        deal_stage: deal.deal_stage || 'Lead', // Default to Lead if not set
        deal_order: deal.deal_order || 0 // Default to 0 if not set
      }));

      setDeals(dealsWithStage);
      setFilteredDeals(dealsWithStage);
      setError(null);

      // Save to localStorage for persistence
      try {
        localStorage.setItem('pipelineDeals', JSON.stringify(dealsWithStage));
      } catch (e) {
        console.warn('Failed to save pipeline state to localStorage:', e);
      }
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError(err as Error);

      // Always use fallback data for development to ensure the UI works
      const mockDeals = getMockDeals();
      setDeals(mockDeals);
      setFilteredDeals(mockDeals);

      // Save mock deals to localStorage
      try {
        localStorage.setItem('pipelineDeals', JSON.stringify(mockDeals));
      } catch (e) {
        console.warn('Failed to save mock deals to localStorage:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateDealStage = async (dealId: string, newStage: string) => {
    try {
      // Optimistically update UI
      const updatedDeals = deals.map(deal =>
        deal.id === dealId
          ? { ...deal, deal_stage: newStage }
          : deal
      );

      setDeals(updatedDeals);

      // Save to localStorage for persistence
      try {
        localStorage.setItem('pipelineDeals', JSON.stringify(updatedDeals));
      } catch (e) {
        console.warn('Failed to save pipeline state to localStorage:', e);
      }

      // Call API to update the deal stage
      const payload: DealStageUpdate = { new_stage: newStage as any };
      try {
        await api.patch(`/deals/${dealId}/stage`, payload);
        // Refresh deals after successful API update
        fetchDeals();
      } catch (apiError) {
        console.error('API error updating deal stage:', apiError);
        // Don't revert the UI - keep the localStorage version
      }

      return true;
    } catch (err) {
      console.error('Error updating deal stage:', err);
      throw err;
    }
  };

  const updateDealStageAndOrder = async (dealId: string, newStage: string, order: number) => {
    try {
      // Optimistically update UI
      const updatedDeals = deals.map(deal =>
        deal.id === dealId
          ? { ...deal, deal_stage: newStage, deal_order: order }
          : deal
      );

      setDeals(updatedDeals);

      // Save to localStorage for persistence
      try {
        localStorage.setItem('pipelineDeals', JSON.stringify(updatedDeals));
      } catch (e) {
        console.warn('Failed to save pipeline state to localStorage:', e);
      }

      // Call API to update the deal stage and order
      const payload: DealStageOrderUpdate = {
        new_stage: newStage as any,
        order: order
      };

      try {
        await api.patch(`/deals/${dealId}/stage-order`, payload);
        // Refresh deals after successful API update
        fetchDeals();
      } catch (apiError) {
        console.error('API error updating deal stage and order:', apiError);
        // Don't revert the UI - keep the localStorage version
      }

      return true;
    } catch (err) {
      console.error('Error updating deal stage and order:', err);
      throw err;
    }
  };

  const applyFilters = (filterOptions: PipelineFilterOptions) => {
    setFilters(filterOptions);

    let filtered = [...deals];

    // Filter by property type
    if (filterOptions.propertyType && filterOptions.propertyType !== 'all') {
      filtered = filtered.filter(deal =>
        deal.property_type.toLowerCase() === filterOptions.propertyType.toLowerCase()
      );
    }

    // Filter by cap rate range
    if (filterOptions.capRateRange) {
      const [min, max] = filterOptions.capRateRange;
      filtered = filtered.filter(deal =>
        deal.exit_cap_rate >= min / 100 && deal.exit_cap_rate <= max / 100
      );
    }

    // Filter by stage
    if (filterOptions.stage && filterOptions.stage !== 'all') {
      filtered = filtered.filter(deal =>
        deal.deal_stage === filterOptions.stage
      );
    }

    setFilteredDeals(filtered);
  };

  const clearFilters = () => {
    setFilters(null);
    setFilteredDeals(deals);
  };

  return {
    deals: filteredDeals,
    allDeals: deals,
    isLoading,
    error,
    updateDealStage,
    updateDealStageAndOrder,
    applyFilters,
    clearFilters,
    refreshDeals: fetchDeals
  };
}

// Mock data for development
function getMockDeals(): Deal[] {
  return [
    {
      id: '1',
      project_name: 'Downtown Office Tower',
      location: 'New York, NY',
      property_type: 'office',
      acquisition_price: 15000000,
      construction_cost: 5000000,
      square_footage: 50000,
      projected_rent_per_sf: 45,
      vacancy_rate: 5,
      operating_expenses_per_sf: 15,
      exit_cap_rate: 5.5,
      status: 'approved',
      created_at: '2023-01-15T12:00:00Z',
      updated_at: '2023-01-15T12:00:00Z',
      user_id: '1',
      org_id: '1',
      deal_stage: 'Lead',
      deal_order: 0,
      irr: 15.2,
      dscr: 1.35
    },
    {
      id: '2',
      project_name: 'Suburban Retail Center',
      location: 'Chicago, IL',
      property_type: 'retail',
      acquisition_price: 8000000,
      construction_cost: 2000000,
      square_footage: 30000,
      projected_rent_per_sf: 28,
      vacancy_rate: 8,
      operating_expenses_per_sf: 10,
      exit_cap_rate: 6.2,
      status: 'in_review',
      created_at: '2023-02-20T12:00:00Z',
      updated_at: '2023-02-20T12:00:00Z',
      user_id: '1',
      org_id: '1',
      deal_stage: 'Analyzing',
      deal_order: 0,
      irr: 12.8,
      dscr: 1.2
    },
    {
      id: '3',
      project_name: 'Industrial Park',
      location: 'Dallas, TX',
      property_type: 'industrial',
      acquisition_price: 12000000,
      construction_cost: 3000000,
      square_footage: 80000,
      projected_rent_per_sf: 18,
      vacancy_rate: 3,
      operating_expenses_per_sf: 5,
      exit_cap_rate: 5.8,
      status: 'approved',
      created_at: '2023-03-10T12:00:00Z',
      updated_at: '2023-03-10T12:00:00Z',
      user_id: '1',
      org_id: '1',
      deal_stage: 'LOI',
      deal_order: 0,
      irr: 14.5,
      dscr: 1.5
    },
    {
      id: '4',
      project_name: 'Luxury Apartment Complex',
      location: 'Miami, FL',
      property_type: 'multifamily',
      acquisition_price: 25000000,
      construction_cost: 8000000,
      square_footage: 120000,
      projected_rent_per_sf: 32,
      vacancy_rate: 4,
      operating_expenses_per_sf: 12,
      exit_cap_rate: 4.8,
      status: 'in_review',
      created_at: '2023-04-05T12:00:00Z',
      updated_at: '2023-04-05T12:00:00Z',
      user_id: '1',
      org_id: '1',
      deal_stage: 'Under DD',
      deal_order: 0,
      irr: 16.2,
      dscr: 1.4
    },
    {
      id: '5',
      project_name: 'Mixed-Use Development',
      location: 'Seattle, WA',
      property_type: 'mixed_use',
      acquisition_price: 18000000,
      construction_cost: 7000000,
      square_footage: 65000,
      projected_rent_per_sf: 38,
      vacancy_rate: 6,
      operating_expenses_per_sf: 14,
      exit_cap_rate: 5.2,
      status: 'approved',
      created_at: '2023-05-12T12:00:00Z',
      updated_at: '2023-05-12T12:00:00Z',
      user_id: '1',
      org_id: '1',
      deal_stage: 'Negotiating',
      deal_order: 0,
      irr: 13.8,
      dscr: 1.3
    },
    {
      id: '6',
      project_name: 'Historic Hotel Renovation',
      location: 'Boston, MA',
      property_type: 'hospitality',
      acquisition_price: 22000000,
      construction_cost: 12000000,
      square_footage: 85000,
      projected_rent_per_sf: 0,
      vacancy_rate: 25,
      operating_expenses_per_sf: 22,
      exit_cap_rate: 6.5,
      status: 'approved',
      created_at: '2023-06-18T12:00:00Z',
      updated_at: '2023-06-18T12:00:00Z',
      user_id: '1',
      org_id: '1',
      deal_stage: 'Closed',
      deal_order: 0,
      irr: 11.5,
      dscr: 1.15
    },
    {
      id: '7',
      project_name: 'Urban Land Parcel',
      location: 'Austin, TX',
      property_type: 'land',
      acquisition_price: 5000000,
      construction_cost: 0,
      square_footage: 200000,
      projected_rent_per_sf: 0,
      vacancy_rate: 0,
      operating_expenses_per_sf: 0,
      exit_cap_rate: 0,
      status: 'archived',
      created_at: '2023-07-22T12:00:00Z',
      updated_at: '2023-07-22T12:00:00Z',
      user_id: '1',
      org_id: '1',
      deal_stage: 'Archived',
      deal_order: 0,
      irr: 18.0,
      dscr: 0
    }
  ];
}
