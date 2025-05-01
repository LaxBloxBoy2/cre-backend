'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../lib/constants';
import { EventInput } from '@fullcalendar/core';

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
  reminder?: '1h' | '1d' | '3d' | '1w';
  assigned_to?: string;
  completed?: boolean;
  completed_at?: string;
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
  reminder?: '1h' | '1d' | '3d' | '1w';
  assigned_to?: string;
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
  reminder?: '1h' | '1d' | '3d' | '1w';
  assigned_to?: string;
}

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
      created_by: event.created_by,
      reminder: event.reminder,
      assigned_to: event.assigned_to,
      completed: event.completed || false,
      completed_at: event.completed_at
    },
    backgroundColor: event.completed ? '#9CA3AF' : getPriorityColor(event.priority, event.event_type),
    borderColor: event.completed ? '#6B7280' : getPriorityColor(event.priority, event.event_type),
    textColor: event.completed ? '#E5E7EB' : '#FFFFFF',
    classNames: event.completed ? ['completed-event'] : [],
  }));
};

// Get color based on priority and event type
export const getPriorityColor = (priority: string, eventType?: string): string => {
  if (eventType === 'lifecycle') return '#10B981'; // Green for lifecycle events

  switch (priority) {
    case 'high':
      return '#EF4444'; // Red for high priority
    case 'medium':
      return '#F59E0B'; // Yellow for medium priority
    case 'low':
    default:
      return '#3B82F6'; // Blue for low priority
  }
};

// Get all calendar events
export const useCalendarEvents = (dealId?: string) => {
  return useQuery({
    queryKey: ['calendar-events', { dealId }],
    queryFn: async () => {
      try {
        // For demo purposes, we'll use the mock data directly
        // In a real app, this would call the API
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

        // Check localStorage for saved events
        const savedEventsJson = localStorage.getItem('calendarEvents');
        let savedEvents: CalendarEvent[] = [];

        if (savedEventsJson) {
          try {
            savedEvents = JSON.parse(savedEventsJson);
          } catch (e) {
            console.error('Error parsing saved events:', e);
          }
        }

        // Combine saved events with fallback events
        const fallbackEvents = generateFallbackEvents(dealId);
        const combinedEvents = [...savedEvents, ...fallbackEvents];

        // Filter by dealId if provided
        const filteredEvents = dealId
          ? combinedEvents.filter(event => event.deal_id === dealId)
          : combinedEvents;

        return { events: filteredEvents };
      } catch (error) {
        console.error('Error fetching calendar events:', error);

        // Return fallback data if something fails
        return {
          events: generateFallbackEvents(dealId),
        };
      }
    },
  });
};

// Create a new calendar event
export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventData: CalendarEventCreate) => {
      try {
        // For demo purposes, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

        // Create a new event with a unique ID
        const newEvent = {
          id: `event-${Date.now()}`,
          ...eventData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'Current User',
        };

        // In a real app, this would be an API call
        // For demo, we'll store in localStorage to persist between page refreshes
        const existingEvents = localStorage.getItem('calendarEvents');
        const events = existingEvents ? JSON.parse(existingEvents) : [];
        events.push(newEvent);
        localStorage.setItem('calendarEvents', JSON.stringify(events));

        return newEvent;
      } catch (error) {
        console.error('Error creating calendar event:', error);

        // Return fallback data if something fails
        const fallbackEvent = {
          id: `temp-${Date.now()}`,
          ...eventData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'Current User',
        };

        // Still try to save to localStorage
        try {
          const existingEvents = localStorage.getItem('calendarEvents');
          const events = existingEvents ? JSON.parse(existingEvents) : [];
          events.push(fallbackEvent);
          localStorage.setItem('calendarEvents', JSON.stringify(events));
        } catch (e) {
          console.error('Failed to save to localStorage:', e);
        }

        return fallbackEvent;
      }
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
      try {
        // For demo purposes, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

        // Get existing events from localStorage
        const savedEventsJson = localStorage.getItem('calendarEvents');
        let events: CalendarEvent[] = [];

        if (savedEventsJson) {
          events = JSON.parse(savedEventsJson);

          // Find and update the event
          const eventIndex = events.findIndex(e => e.id === eventId);
          if (eventIndex !== -1) {
            events[eventIndex] = {
              ...events[eventIndex],
              ...data,
              updated_at: new Date().toISOString(),
            };

            // Save back to localStorage
            localStorage.setItem('calendarEvents', JSON.stringify(events));

            return events[eventIndex];
          }
        }

        // If event not found in localStorage, return mock updated event
        return {
          id: eventId,
          ...data,
          updated_at: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Error updating calendar event:', error);

        // Return fallback data if something fails
        return {
          id: eventId,
          ...data,
          updated_at: new Date().toISOString(),
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
};

// Toggle event completion status
export const useToggleEventCompletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      try {
        // For demo purposes, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay

        // Get existing events from localStorage
        const savedEventsJson = localStorage.getItem('calendarEvents');
        let events: CalendarEvent[] = [];

        if (savedEventsJson) {
          events = JSON.parse(savedEventsJson);

          // Find the event
          const eventIndex = events.findIndex(e => e.id === eventId);
          if (eventIndex !== -1) {
            // Toggle completed status
            const isCompleted = !events[eventIndex].completed;

            events[eventIndex] = {
              ...events[eventIndex],
              completed: isCompleted,
              completed_at: isCompleted ? new Date().toISOString() : undefined,
              updated_at: new Date().toISOString(),
            };

            // Save back to localStorage
            localStorage.setItem('calendarEvents', JSON.stringify(events));

            return events[eventIndex];
          }
        }

        // If event not found, return a mock response
        return {
          id: eventId,
          completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Error toggling event completion:', error);

        // Return fallback data
        return {
          id: eventId,
          completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
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
      try {
        // For demo purposes, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

        // Get existing events from localStorage
        const savedEventsJson = localStorage.getItem('calendarEvents');
        if (savedEventsJson) {
          const events: CalendarEvent[] = JSON.parse(savedEventsJson);

          // Filter out the event to delete
          const updatedEvents = events.filter(e => e.id !== eventId);

          // Save back to localStorage
          localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
        }

        // Return success response
        return { id: eventId, success: true };
      } catch (error) {
        console.error('Error deleting calendar event:', error);
        return { id: eventId, success: true }; // Still return success for demo
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
};

// Fetch deal lifecycle events
export const useDealLifecycleEvents = (dealId: string) => {
  return useQuery({
    queryKey: ['deal-lifecycle-events', dealId],
    queryFn: async () => {
      try {
        // For demo purposes, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay

        // Mock lifecycle data
        const mockData = {
          deal_id: dealId,
          deal_name: dealId === '1' ? 'Office Building A' : dealId === '2' ? 'Retail Center B' : 'Industrial Park C',
          changes: [
            {
              id: '1',
              status: 'draft',
              created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
              created_by: 'John Doe'
            },
            {
              id: '2',
              status: 'in_review',
              created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
              created_by: 'Jane Smith'
            },
            {
              id: '3',
              status: 'approved',
              created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
              created_by: 'Bob Johnson'
            }
          ]
        };

        return mapLifecycleToEvents(mockData, dealId);
      } catch (error) {
        console.error('Error fetching deal lifecycle events:', error);
        return [];
      }
    },
    enabled: !!dealId,
  });
};

// Fetch alert deadlines
export const useAlertDeadlines = () => {
  return useQuery({
    queryKey: ['alert-deadlines'],
    queryFn: async () => {
      try {
        // For demo purposes, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay

        // Mock alerts data
        const mockAlerts = [
          {
            id: '1',
            deal_id: '1',
            deal_name: 'Office Building A',
            alert_type: 'Due Diligence',
            message: 'Due diligence deadline approaching',
            severity: 'high',
            created_at: new Date().toISOString(),
            due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
            resolved: false
          },
          {
            id: '2',
            deal_id: '2',
            deal_name: 'Retail Center B',
            alert_type: 'Financing',
            message: 'Loan application deadline',
            severity: 'medium',
            created_at: new Date().toISOString(),
            due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
            resolved: false
          }
        ];

        return mapAlertsToEvents(mockAlerts);
      } catch (error) {
        console.error('Error fetching alert deadlines:', error);
        return [];
      }
    },
  });
};

// Fetch deals for dropdown
export const useDeals = () => {
  return useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      try {
        // For demo purposes, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay

        // Return mock deals
        return [
          { id: '1', project_name: 'Office Building A' },
          { id: '2', project_name: 'Retail Center B' },
          { id: '3', project_name: 'Industrial Park C' },
        ];
      } catch (error) {
        console.error('Error fetching deals:', error);

        // Return fallback data if something fails
        return [
          { id: '1', project_name: 'Office Building A' },
          { id: '2', project_name: 'Retail Center B' },
          { id: '3', project_name: 'Industrial Park C' },
        ];
      }
    },
  });
};

// Helper function to map lifecycle changes to calendar events
const mapLifecycleToEvents = (lifecycleData: any, dealId: string): EventInput[] => {
  if (!lifecycleData || !lifecycleData.changes) return [];

  return lifecycleData.changes.map((change: any) => ({
    id: `lifecycle-${change.id}`,
    title: `${change.status} - ${lifecycleData.deal_name}`,
    start: change.created_at,
    end: change.created_at, // Same day event
    allDay: true,
    extendedProps: {
      description: `Deal status changed to ${change.status} by ${change.created_by}`,
      deal_id: dealId,
      priority: 'medium',
      event_type: 'lifecycle',
      created_at: change.created_at,
      updated_at: change.created_at,
      created_by: change.created_by
    },
    backgroundColor: '#10B981', // Green for lifecycle events
    borderColor: '#10B981',
  }));
};

// Helper function to map alerts to calendar events
const mapAlertsToEvents = (alerts: any[]): EventInput[] => {
  if (!alerts || !alerts.length) return [];

  return alerts
    .filter(alert => !alert.resolved && alert.due_date) // Only include unresolved alerts with due dates
    .map(alert => ({
      id: `alert-${alert.id}`,
      title: `${alert.alert_type} - ${alert.deal_name || 'No Deal'}`,
      start: alert.due_date,
      end: alert.due_date, // Same day event
      allDay: true,
      extendedProps: {
        description: alert.message,
        deal_id: alert.deal_id,
        priority: alert.severity,
        event_type: 'deadline',
        created_at: alert.created_at,
        updated_at: alert.created_at,
        created_by: 'System'
      },
      backgroundColor: getPriorityColor(alert.severity, 'deadline'),
      borderColor: getPriorityColor(alert.severity, 'deadline'),
    }));
};

// Generate fallback events for testing
const generateFallbackEvents = (dealId?: string): CalendarEvent[] => {
  const now = new Date();

  // Create dates for events
  const today = new Date(now);
  today.setHours(10, 0, 0, 0);

  const todayEnd = new Date(today);
  todayEnd.setHours(11, 30, 0, 0);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(17, 0, 0, 0);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 0, 0, 0);

  const nextWeekEnd = new Date(nextWeek);
  nextWeekEnd.setHours(15, 30, 0, 0);

  const twoWeeksLater = new Date(now);
  twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

  const threeWeeksLater = new Date(now);
  threeWeeksLater.setDate(threeWeeksLater.getDate() + 21);

  // Filter events by dealId if provided
  let events: CalendarEvent[] = [
    {
      id: '1',
      title: 'Due Diligence Deadline',
      description: 'Complete all due diligence tasks by this date',
      start: tomorrow.toISOString(),
      end: tomorrow.toISOString(),
      deal_id: '1',
      priority: 'high',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      created_by: 'John Doe',
      event_type: 'deadline',
      all_day: true,
      reminder: '1d',
      assigned_to: 'user1'
    },
    {
      id: '2',
      title: 'Investor Meeting',
      description: 'Present deal to potential investors',
      start: nextWeek.toISOString(),
      end: nextWeekEnd.toISOString(),
      deal_id: '1',
      priority: 'medium',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      created_by: 'John Doe',
      event_type: 'custom',
      all_day: false,
      reminder: '1d',
      assigned_to: 'user2'
    },
    {
      id: '3',
      title: 'Closing Date',
      description: 'Final closing on property acquisition',
      start: twoWeeksLater.toISOString(),
      end: twoWeeksLater.toISOString(),
      deal_id: '2',
      priority: 'high',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      created_by: 'Jane Smith',
      event_type: 'lifecycle',
      all_day: true,
      reminder: '3d',
      assigned_to: 'user1'
    },
    {
      id: '4',
      title: 'Market Research',
      description: 'Complete market analysis for new acquisition',
      start: today.toISOString(),
      end: todayEnd.toISOString(),
      deal_id: '3',
      priority: 'low',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      created_by: 'Bob Johnson',
      event_type: 'custom',
      all_day: false,
      assigned_to: 'user3'
    },
    {
      id: '5',
      title: 'Property Inspection',
      description: 'On-site inspection with building engineer',
      start: tomorrow.toISOString(),
      end: tomorrowEnd.toISOString(),
      deal_id: '1',
      priority: 'medium',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      created_by: 'Jane Smith',
      event_type: 'custom',
      all_day: false,
      reminder: '1h',
      assigned_to: 'user4'
    },
    {
      id: '6',
      title: 'Loan Application Deadline',
      description: 'Submit all financing documents',
      start: threeWeeksLater.toISOString(),
      end: threeWeeksLater.toISOString(),
      deal_id: '2',
      priority: 'high',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      created_by: 'John Doe',
      event_type: 'deadline',
      all_day: true,
      reminder: '1w',
      assigned_to: 'user2'
    }
  ];

  // Filter by dealId if provided
  if (dealId) {
    events = events.filter(event => event.deal_id === dealId);
  }

  return events;
};
