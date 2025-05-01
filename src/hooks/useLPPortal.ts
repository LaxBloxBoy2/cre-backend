'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// API URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cre-backend-0pvq.onrender.com';

// API client with auth header
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

// Types
export interface LPDealSummary {
  id: string;
  project_name: string;
  location: string;
  property_type: string;
  investment_amount: number;
  current_value: number;
  return_percentage: number;
  irr: number;
  investment_date: string;
  status: string;
}

export interface LPPortfolioSummary {
  total_investment: number;
  current_value: number;
  total_return_percentage: number;
  annualized_return_percentage: number;
  cash_distributed: number;
  investment_count: number;
}

export interface LPDistribution {
  id: string;
  deal_id: string;
  deal_name: string;
  amount: number;
  distribution_date: string;
  distribution_type: string;
  status: string;
}

export interface LPDocument {
  id: string;
  name: string;
  document_type: string;
  upload_date: string;
  size: number;
  url: string;
}

export interface LPComment {
  message: string;
  is_question: boolean;
}

// Get LP deals
export const useLPDeals = (skip = 0, limit = 100) => {
  return useQuery({
    queryKey: ['lp-deals', { skip, limit }],
    queryFn: async () => {
      try {
        const response = await api.get('/api/lp/deals', { params: { skip, limit } });
        return response.data;
      } catch (error) {
        console.error('Error fetching LP deals:', error);
        // Return fallback data if API fails
        return { deals: [], total: 0 };
      }
    },
  });
};

// Get LP portfolio summary
export const useLPPortfolioSummary = () => {
  return useQuery({
    queryKey: ['lp-portfolio-summary'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/lp/portfolio-summary');
        return response.data;
      } catch (error) {
        console.error('Error fetching LP portfolio summary:', error);
        // Return fallback data if API fails
        return {
          total_investment: 0,
          current_value: 0,
          total_return_percentage: 0,
          annualized_return_percentage: 0,
          cash_distributed: 0,
          investment_count: 0,
        };
      }
    },
  });
};

// Get LP distributions
export const useLPDistributions = (skip = 0, limit = 100) => {
  return useQuery({
    queryKey: ['lp-distributions', { skip, limit }],
    queryFn: async () => {
      try {
        const response = await api.get('/api/lp/distributions', { params: { skip, limit } });
        return response.data;
      } catch (error) {
        console.error('Error fetching LP distributions:', error);
        // Return fallback data if API fails
        return { distributions: [], total: 0 };
      }
    },
  });
};

// Get LP documents
export const useLPDocuments = (documentType?: string, skip = 0, limit = 100) => {
  return useQuery({
    queryKey: ['lp-documents', { documentType, skip, limit }],
    queryFn: async () => {
      try {
        const params: Record<string, any> = { skip, limit };
        if (documentType) params.document_type = documentType;

        const response = await api.get('/api/lp/documents', { params });
        return response.data;
      } catch (error) {
        console.error('Error fetching LP documents:', error);
        // Return fallback data if API fails
        return { documents: [], total: 0 };
      }
    },
  });
};

// Get LP deal details
export const useLPDeal = (dealId: string) => {
  return useQuery({
    queryKey: ['lp-deal', dealId],
    queryFn: async () => {
      try {
        const response = await api.get(`/api/lp/deals/${dealId}`);
        return response.data;
      } catch (error) {
        console.error(`Error fetching LP deal ${dealId}:`, error);
        throw error;
      }
    },
    enabled: !!dealId,
  });
};

// Get LP deal comments
export const useLPDealComments = (dealId: string, skip = 0, limit = 100) => {
  return useQuery({
    queryKey: ['lp-deal-comments', dealId, { skip, limit }],
    queryFn: async () => {
      try {
        const response = await api.get(`/api/lp/deals/${dealId}/comments`, { params: { skip, limit } });
        return response.data;
      } catch (error) {
        console.error(`Error fetching LP deal comments for deal ${dealId}:`, error);
        // Return fallback data if API fails
        return { comments: [], total: 0 };
      }
    },
    enabled: !!dealId,
  });
};

// Add LP deal comment
export const useAddLPDealComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dealId, comment }: { dealId: string; comment: LPComment }) => {
      const response = await api.post(`/api/lp/deals/${dealId}/comments`, comment);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lp-deal-comments', variables.dealId] });
    },
  });
};
