'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { useDeals } from '../../hooks/useCalendarEvents';
import {
  CalendarIcon,
  ExclamationTriangleIcon,
  TimerIcon,
  Cross2Icon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@radix-ui/react-icons';

interface CalendarFiltersProps {
  onFilterChange: (filters: {
    dealId: string;
    priority: string;
    eventType: string;
  }) => void;
  eventCounts: {
    total: number;
    byDeal: Record<string, number>;
    byPriority: Record<string, number>;
    byEventType: Record<string, number>;
  };
}

export default function CalendarFilters({ onFilterChange, eventCounts }: CalendarFiltersProps) {
  // State
  const [filterDealId, setFilterDealId] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterEventType, setFilterEventType] = useState<string>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Fetch deals for dropdown
  const { data: deals, isLoading: dealsLoading } = useDeals();

  // Update parent component when filters change
  useEffect(() => {
    onFilterChange({
      dealId: filterDealId,
      priority: filterPriority,
      eventType: filterEventType
    });
  }, [filterDealId, filterPriority, filterEventType]);

  // Reset filters
  const resetFilters = () => {
    setFilterDealId('all');
    setFilterPriority('all');
    setFilterEventType('all');
  };

  return (
    <div className="rounded-xl shadow-lg" style={{
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--border-dark)'
    }}>
      <div className="p-4 flex justify-between items-center border-b" style={{ borderColor: 'var(--border-dark)' }}>
        <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          Filters
          <Badge className="ml-2 bg-accent text-white">{eventCounts.total}</Badge>
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="md:hidden"
        >
          {isCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
        </Button>
      </div>

      <div className={`p-4 ${isCollapsed ? 'hidden' : 'block'} md:block`}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filter-deal" className="flex items-center justify-between">
              <span>Deal</span>
              <Badge variant="outline">{eventCounts.byDeal[filterDealId] || eventCounts.total}</Badge>
            </Label>
            <Select value={filterDealId} onValueChange={setFilterDealId}>
              <SelectTrigger>
                <SelectValue placeholder="All Deals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deals</SelectItem>
                {dealsLoading ? (
                  <SelectItem value="loading" disabled>Loading deals...</SelectItem>
                ) : (
                  deals?.map((deal: any) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.project_name}
                      <Badge variant="outline" className="ml-2">{eventCounts.byDeal[deal.id] || 0}</Badge>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-priority" className="flex items-center justify-between">
              <span>Priority</span>
              <Badge variant="outline">{eventCounts.byPriority[filterPriority] || eventCounts.total}</Badge>
            </Label>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low" className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  Low
                  <Badge variant="outline" className="ml-2">{eventCounts.byPriority.low || 0}</Badge>
                </SelectItem>
                <SelectItem value="medium" className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  Medium
                  <Badge variant="outline" className="ml-2">{eventCounts.byPriority.medium || 0}</Badge>
                </SelectItem>
                <SelectItem value="high" className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  High
                  <Badge variant="outline" className="ml-2">{eventCounts.byPriority.high || 0}</Badge>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-event-type" className="flex items-center justify-between">
              <span>Event Type</span>
              <Badge variant="outline">{eventCounts.byEventType[filterEventType] || eventCounts.total}</Badge>
            </Label>
            <Select value={filterEventType} onValueChange={setFilterEventType}>
              <SelectTrigger>
                <SelectValue placeholder="All Event Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Event Types</SelectItem>
                <SelectItem value="custom" className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Custom
                  <Badge variant="outline" className="ml-2">{eventCounts.byEventType.custom || 0}</Badge>
                </SelectItem>
                <SelectItem value="lifecycle" className="flex items-center">
                  <TimerIcon className="h-4 w-4 mr-2" />
                  Lifecycle
                  <Badge variant="outline" className="ml-2">{eventCounts.byEventType.lifecycle || 0}</Badge>
                </SelectItem>
                <SelectItem value="deadline" className="flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  Deadline
                  <Badge variant="outline" className="ml-2">{eventCounts.byEventType.deadline || 0}</Badge>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={resetFilters}
            className="w-full flex items-center justify-center"
          >
            <Cross2Icon className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Legend</h2>

          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
              <span style={{ color: 'var(--text-muted)' }}>High Priority</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
              <span style={{ color: 'var(--text-muted)' }}>Medium Priority</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
              <span style={{ color: 'var(--text-muted)' }}>Low Priority</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
              <span style={{ color: 'var(--text-muted)' }}>Lifecycle Events</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
