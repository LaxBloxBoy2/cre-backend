'use client';

import { useQuery } from '@tanstack/react-query';
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
export interface DashboardMetrics {
  total_deals: number;
  total_acquisition_price: number;
  total_construction_cost: number;
  total_square_footage: number;
  average_cap_rate: number;
  average_development_margin: number;
  average_irr: number;
  average_dscr: number;
  status_counts: Record<string, number>;
  property_type_counts: Record<string, number>;
}

export interface IRRTrendPoint {
  date: string;
  irr: number;
}

export interface IRRTrend {
  data: IRRTrendPoint[];
  period: string;
}

export interface DealLifecycleStage {
  name: string;
  avg_days: number;
  target_days: number;
}

export interface DealLifecycle {
  stages: DealLifecycleStage[];
  total_avg_days: number;
  total_target_days: number;
}

export interface RiskScore {
  score: number;
  level: 'low' | 'medium' | 'high';
  factors: string[];
}

export interface DealStatusBreakdown {
  statuses: Record<string, number>;
  total: number;
}

export interface QuickActionCounts {
  tasks_due_soon: number;
  alerts_unresolved: number;
  deals_in_review: number;
  documents_pending: number;
}

// Dashboard metrics
export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/dashboard-summary');
        return response.data;
      } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        // Return fallback data if API fails
        return {
          total_deals: 0,
          total_acquisition_price: 0,
          total_construction_cost: 0,
          total_square_footage: 0,
          average_cap_rate: 0,
          average_development_margin: 0,
          average_irr: 0,
          average_dscr: 0,
          status_counts: {},
          property_type_counts: {},
        };
      }
    },
  });
};

// IRR trend
export const useIRRTrend = (period = '6m') => {
  return useQuery({
    queryKey: ['irr-trend', period],
    queryFn: async () => {
      try {
        const response = await api.get('/api/dashboard/irr-trend', { params: { period } });
        return response.data;
      } catch (error) {
        console.error(`Error fetching IRR trend for period ${period}:`, error);
        // Return fallback data if API fails
        return {
          data: [],
          period,
        };
      }
    },
  });
};

// Deal lifecycle
export const useDealLifecycle = () => {
  return useQuery({
    queryKey: ['deal-lifecycle'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/dashboard/deal-lifecycle');
        return response.data;
      } catch (error) {
        console.error('Error fetching deal lifecycle:', error);
        // Return fallback data if API fails
        return {
          stages: [],
          total_avg_days: 0,
          total_target_days: 0,
        };
      }
    },
  });
};

// Risk score
export const useRiskScore = () => {
  return useQuery({
    queryKey: ['risk-score'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/dashboard/risk-score');
        return response.data;
      } catch (error) {
        console.error('Error fetching risk score:', error);
        // Return fallback data if API fails
        return {
          score: 50,
          level: 'medium',
          factors: [],
        };
      }
    },
  });
};

// Deal status breakdown
export const useDealStatusBreakdown = () => {
  return useQuery({
    queryKey: ['deal-status-breakdown'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/dashboard/deal-status-breakdown');
        return response.data;
      } catch (error) {
        console.error('Error fetching deal status breakdown:', error);
        // Return fallback data if API fails
        return {
          statuses: {},
          total: 0,
        };
      }
    },
  });
};

// Quick action counts
export const useQuickActionCounts = () => {
  return useQuery({
    queryKey: ['quick-actions'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/dashboard/quick-actions');
        return response.data;
      } catch (error) {
        console.error('Error fetching quick action counts:', error);
        // Return fallback data if API fails
        return {
          tasks_due_soon: 0,
          alerts_unresolved: 0,
          deals_in_review: 0,
          documents_pending: 0,
        };
      }
    },
  });
};
