'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../lib/constants';
import { Skeleton } from './ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

// API client with auth header
const api = axios.create({
  baseURL: API_URL,
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

export default function DealSelector() {
  const router = useRouter();
  const [selectedDeal, setSelectedDeal] = useState<string>('');

  // Fetch deals
  const { data: deals, isLoading, error } = useQuery({
    queryKey: ['deals'],
    queryFn: () => api.get('/api/deals').then(res => res.data),
  });

  // Handle deal selection
  const handleDealChange = (value: string) => {
    setSelectedDeal(value);
    if (value) {
      router.push(`/deals/${value}`);
    }
  };

  if (isLoading) {
    return (
      <div className="w-64">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    );
  }

  // Fallback data if API fails
  const fallbackDeals = [
    { id: '1', project_name: 'Office Building A' },
    { id: '2', project_name: 'Retail Center B' },
    { id: '3', project_name: 'Industrial Park C' },
  ];

  // Use real data if available, otherwise fallback
  const dealOptions = Array.isArray(deals) ? deals : fallbackDeals;

  return (
    <div className="w-64">
      <Select value={selectedDeal} onValueChange={handleDealChange}>
        <SelectTrigger className="w-full bg-dark-card-hover border-dark-border text-white">
          <SelectValue placeholder="Select a deal" />
        </SelectTrigger>
        <SelectContent className="bg-dark-card border-dark-border text-white">
          {dealOptions.map((deal) => (
            <SelectItem key={deal.id} value={deal.id} className="hover:bg-dark-card-hover">
              {deal.project_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
