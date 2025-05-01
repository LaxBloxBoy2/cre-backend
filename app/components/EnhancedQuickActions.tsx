'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../lib/constants';
import { Skeleton } from './ui/skeleton';
import Link from 'next/link';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

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

export default function EnhancedQuickActions() {
  const [selectedDealId, setSelectedDealId] = useState<string>('1'); // Default to first deal
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isScheduleMeetingOpen, setIsScheduleMeetingOpen] = useState(false);

  // Fetch deals
  const { data: deals, isLoading: dealsLoading, error: dealsError } = useQuery({
    queryKey: ['deals'],
    queryFn: () => api.get('/api/deals').then(res => res.data),
  });

  // Fetch quick action counts
  const { data: actionCounts, isLoading: countsLoading, error: countsError } = useQuery({
    queryKey: ['quick-actions'],
    queryFn: () => api.get('/api/dashboard/quick-actions').then(res => res.data),
  });

  const isLoading = dealsLoading || countsLoading;
  const error = dealsError || countsError;

  if (isLoading) {
    return (
      <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
              <div className="mr-4">
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !deals) {
    console.error('Error loading quick actions data:', error);
    // Continue with fallback data
  }

  // Fallback data if API fails
  const fallbackDeals = [
    { id: '1', project_name: 'Office Building A' },
    { id: '2', project_name: 'Retail Center B' },
    { id: '3', project_name: 'Industrial Park C' }
  ];

  const fallbackCounts = {
    pending_tasks: 5,
    unresolved_alerts: 3,
    upcoming_deadlines: 2
  };

  // Use real data if available, otherwise fallback
  const dealOptions = deals || fallbackDeals;
  const counts = actionCounts || fallbackCounts;

  // Handle deal selection change
  const handleDealChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDealId(e.target.value);
  };

  return (
    <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
        <select
          value={selectedDealId}
          onChange={handleDealChange}
          className="rounded-md px-3 py-1 text-sm border"
          style={{
            backgroundColor: 'var(--bg-card-hover)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-dark)'
          }}
        >
          {dealOptions.map((deal) => (
            <option key={deal.id} value={deal.id}>
              {deal.project_name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link
          href={`/deals/${selectedDealId}/documents`}
          className="flex flex-col items-center justify-center p-4 rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--bg-card-hover)',
            '&:hover': { backgroundColor: 'var(--bg-card-hover-darker)' }
          }}
        >
          <svg className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--accent)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-xs" style={{ color: 'var(--text-primary)' }}>Upload File</span>
        </Link>

        <Link
          href={`/deals/${selectedDealId}/generate-memo`}
          className="flex flex-col items-center justify-center p-4 rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--bg-card-hover)',
            '&:hover': { backgroundColor: 'var(--bg-card-hover-darker)' }
          }}
        >
          <svg className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--accent)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs" style={{ color: 'var(--text-primary)' }}>Generate Memo</span>
        </Link>

        <Link
          href={`/deals/${selectedDealId}/upload-lease`}
          className="flex flex-col items-center justify-center p-4 rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--bg-card-hover)',
            '&:hover': { backgroundColor: 'var(--bg-card-hover-darker)' }
          }}
        >
          <svg className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--accent)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs" style={{ color: 'var(--text-primary)' }}>Analyze Lease</span>
        </Link>

        <Link
          href={`/deals/${selectedDealId}/generate-report`}
          className="flex flex-col items-center justify-center p-4 rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--bg-card-hover)',
            '&:hover': { backgroundColor: 'var(--bg-card-hover-darker)' }
          }}
        >
          <svg className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--accent)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs" style={{ color: 'var(--text-primary)' }}>Generate Report</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Add Note Dialog */}
        <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center justify-center p-4 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80 transition-colors border-dark-border w-full h-full"
            >
              <div className="flex flex-col items-center">
                <svg className="h-6 w-6 text-accent mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-xs text-white">Add Note</span>
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-dark-card border-dark-border text-white">
            <DialogHeader>
              <DialogTitle>Add Note to Deal</DialogTitle>
            </DialogHeader>
            <form className="space-y-4">
              <div>
                <label htmlFor="note-title" className="text-sm text-text-secondary">Title</label>
                <Input id="note-title" className="bg-dark-card-hover border-dark-border text-white" />
              </div>
              <div>
                <label htmlFor="note-content" className="text-sm text-text-secondary">Content</label>
                <Textarea id="note-content" rows={4} className="bg-dark-card-hover border-dark-border text-white" />
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => setIsAddNoteOpen(false)}
                  className="bg-accent text-white hover:bg-accent/80"
                >
                  Save Note
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Schedule Meeting Dialog */}
        <Dialog open={isScheduleMeetingOpen} onOpenChange={setIsScheduleMeetingOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center justify-center p-4 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80 transition-colors border-dark-border w-full h-full"
            >
              <div className="flex flex-col items-center">
                <svg className="h-6 w-6 text-accent mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-white">Schedule Meeting</span>
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-dark-card border-dark-border text-white">
            <DialogHeader>
              <DialogTitle>Schedule Meeting</DialogTitle>
            </DialogHeader>
            <form className="space-y-4">
              <div>
                <label htmlFor="meeting-title" className="text-sm text-text-secondary">Title</label>
                <Input id="meeting-title" className="bg-dark-card-hover border-dark-border text-white" />
              </div>
              <div>
                <label htmlFor="meeting-date" className="text-sm text-text-secondary">Date</label>
                <Input id="meeting-date" type="date" className="bg-dark-card-hover border-dark-border text-white" />
              </div>
              <div>
                <label htmlFor="meeting-time" className="text-sm text-text-secondary">Time</label>
                <Input id="meeting-time" type="time" className="bg-dark-card-hover border-dark-border text-white" />
              </div>
              <div>
                <label htmlFor="meeting-notes" className="text-sm text-text-secondary">Notes</label>
                <Textarea id="meeting-notes" rows={2} className="bg-dark-card-hover border-dark-border text-white" />
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => setIsScheduleMeetingOpen(false)}
                  className="bg-accent text-white hover:bg-accent/80"
                >
                  Schedule
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Status Overview</h3>
        <div className="space-y-3">
          <Link
            href="/tasks"
            className="flex items-center justify-between p-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--bg-card-hover-lighter)',
              '&:hover': { backgroundColor: 'var(--bg-card-hover)' }
            }}
          >
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Pending Tasks</span>
            <span className="text-xs px-2 py-1 rounded-full" style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}>{counts.pending_tasks}</span>
          </Link>
          <Link
            href="/alerts"
            className="flex items-center justify-between p-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--bg-card-hover-lighter)',
              '&:hover': { backgroundColor: 'var(--bg-card-hover)' }
            }}
          >
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Unresolved Alerts</span>
            <span className="text-xs px-2 py-1 rounded-full" style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}>{counts.unresolved_alerts}</span>
          </Link>
          <Link
            href="/calendar"
            className="flex items-center justify-between p-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--bg-card-hover-lighter)',
              '&:hover': { backgroundColor: 'var(--bg-card-hover)' }
            }}
          >
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Upcoming Deadlines</span>
            <span className="text-xs px-2 py-1 rounded-full" style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}>{counts.upcoming_deadlines}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
