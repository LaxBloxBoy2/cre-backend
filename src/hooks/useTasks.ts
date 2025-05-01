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
export interface UserInfo {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  id: string;
  deal_id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  completed: boolean;
  created_at: string;
  created_by: string;
  creator?: UserInfo;
  assignees: UserInfo[];
}

export interface TaskCreate {
  deal_id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  assignee_ids?: string[];
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  completed?: boolean;
  assignee_ids?: string[];
}

// Get all tasks for a deal
export const useDealTasks = (dealId: string, completed?: boolean) => {
  return useQuery({
    queryKey: ['deal-tasks', dealId, { completed }],
    queryFn: async () => {
      try {
        const params: Record<string, any> = {};
        if (completed !== undefined) params.completed = completed;

        const response = await api.get(`/api/deals/${dealId}/tasks`, { params });
        return response.data;
      } catch (error) {
        console.error(`Error fetching tasks for deal ${dealId}:`, error);
        // Return fallback data if API fails
        return { tasks: [], total: 0 };
      }
    },
    enabled: !!dealId,
  });
};

// Get all tasks (across all deals)
export const useAllTasks = (completed?: boolean) => {
  return useQuery({
    queryKey: ['all-tasks', { completed }],
    queryFn: async () => {
      try {
        const params: Record<string, any> = {};
        if (completed !== undefined) params.completed = completed;

        const response = await api.get('/api/tasks', { params });
        return response.data;
      } catch (error) {
        console.error('Error fetching all tasks:', error);
        // Return fallback data if API fails
        return { tasks: [], total: 0 };
      }
    },
  });
};

// Get a specific task
export const useTask = (taskId: string) => {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      try {
        const response = await api.get(`/api/tasks/${taskId}`);
        return response.data;
      } catch (error) {
        console.error(`Error fetching task ${taskId}:`, error);
        throw error;
      }
    },
    enabled: !!taskId,
  });
};

// Create a task
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: TaskCreate) => {
      const response = await api.post(`/api/deals/${task.deal_id}/tasks`, task);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deal-tasks', data.deal_id] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
    },
  });
};

// Update a task
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: TaskUpdate }) => {
      const response = await api.patch(`/api/tasks/${taskId}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task', data.id] });
      queryClient.invalidateQueries({ queryKey: ['deal-tasks', data.deal_id] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
    },
  });
};

// Delete a task
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/api/tasks/${taskId}`);
      return taskId;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables] });
      queryClient.invalidateQueries({ queryKey: ['deal-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
    },
  });
};
