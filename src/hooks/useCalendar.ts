'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { EventInput } from '@fullcalendar/core';

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
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  deal_id?: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  created_by: string;
  event_type?: 'custom' | 'lifecycle' | 'deadline';
  all_day?: boolean;
}

export interface CalendarEventCreate {
  title: string;
  description?: string;
  start: string;
  end: string;
  deal_id?: string;
  priority: 'low' | 'medium' | 'high';
  event_type?: 'custom' | 'lifecycle' | 'deadline';
  all_day?: boolean;
}

export interface CalendarEventUpdate {
  title?: string;
  description?: string;
  start?: string;
  end?: string;
  deal_id?: string;
  priority?: 'low' | 'medium' | 'high';
  event_type?: 'custom' | 'lifecycle' | 'deadline';
  all_day?: boolean;
}

// Helper function to get color based on priority and event type
const getPriorityColor = (priority: string, eventType?: string): string => {
  if (eventType === 'lifecycle') return '#3B82F6'; // blue
  if (eventType === 'deadline') return '#F59E0B'; // amber
  
  switch (priority) {
    case 'high':
      return '#EF4444'; // red
    case 'medium':
      return '#F59E0B'; // amber
    case 'low':
      return '#10B981'; // green
    default:
      return '#6B7280'; // gray
  }
};

// Convert API events to FullCalendar events
export const mapToCalendarEvents = (events: CalendarEvent[]): EventInput[] => {
  return events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.all_day || false,
    extendedProps: {
      description: event.description,
      deal_id: event.deal_id,
      priority: event.priority,
      event_type: event.event_type,
      created_at: event.created_at,
      updated_at: event.updated_at,
      created_by: event.created_by
    },
    backgroundColor: getPriorityColor(event.priority, event.event_type),
    borderColor: getPriorityColor(event.priority, event.event_type),
  }));
};

// Get all calendar events
export const useCalendarEvents = (dealId?: string) => {
  return useQuery({
    queryKey: ['calendar-events', { dealId }],
    queryFn: async () => {
      try {
        const params: Record<string, any> = {};
        if (dealId) params.deal_id = dealId;

        const response = await api.get('/api/calendar-events', { params });
        return response.data;
      } catch (error) {
        console.error('Error fetching calendar events:', error);
        // Return fallback data if API fails
        return { events: [] };
      }
    },
  });
};

// Get a specific calendar event
export const useCalendarEvent = (eventId: string) => {
  return useQuery({
    queryKey: ['calendar-event', eventId],
    queryFn: async () => {
      try {
        const response = await api.get(`/api/calendar-events/${eventId}`);
        return response.data;
      } catch (error) {
        console.error(`Error fetching calendar event ${eventId}:`, error);
        throw error;
      }
    },
    enabled: !!eventId,
  });
};

// Create a calendar event
export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: CalendarEventCreate) => {
      const response = await api.post('/api/calendar-events', event);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
};

// Update a calendar event
export const useUpdateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, data }: { eventId: string; data: CalendarEventUpdate }) => {
      const response = await api.put(`/api/calendar-events/${eventId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
};

// Delete a calendar event
export const useDeleteCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      await api.delete(`/api/calendar-events/${eventId}`);
      return eventId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
};
