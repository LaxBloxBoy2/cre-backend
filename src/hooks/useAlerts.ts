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
export interface Alert {
  id: string;
  deal_id: string;
  deal_name?: string;
  alert_type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  created_at: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

export interface AlertResolve {
  resolution_note?: string;
}

// Get all alerts
export const useAlerts = (dealId?: string, resolved?: boolean) => {
  return useQuery({
    queryKey: ['alerts', { dealId, resolved }],
    queryFn: async () => {
      try {
        const params: Record<string, any> = {};
        if (dealId) params.deal_id = dealId;
        if (resolved !== undefined) params.resolved = resolved;

        const response = await api.get('/api/alerts', { params });
        return response.data;
      } catch (error) {
        console.error('Error fetching alerts:', error);
        // Return fallback data if API fails
        return { alerts: [], total: 0 };
      }
    },
  });
};

// Get a specific alert
export const useAlert = (alertId: string) => {
  return useQuery({
    queryKey: ['alert', alertId],
    queryFn: async () => {
      try {
        const response = await api.get(`/api/alerts/${alertId}`);
        return response.data;
      } catch (error) {
        console.error(`Error fetching alert ${alertId}:`, error);
        throw error;
      }
    },
    enabled: !!alertId,
  });
};

// Resolve an alert
export const useResolveAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ alertId, data }: { alertId: string; data: AlertResolve }) => {
      const response = await api.post(`/api/alerts/${alertId}/resolve`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

// Get alert counts
export const useAlertCounts = () => {
  return useQuery({
    queryKey: ['alert-counts'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/alerts/counts');
        return response.data;
      } catch (error) {
        console.error('Error fetching alert counts:', error);
        // Return fallback data if API fails
        return { 
          total: 0, 
          high: 0, 
          medium: 0, 
          low: 0, 
          resolved: 0, 
          unresolved: 0 
        };
      }
    },
  });
};
