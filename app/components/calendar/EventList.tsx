'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../ui/table";
import { Button } from "../ui/button";
import {
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
  MixerHorizontalIcon,
  CheckIcon,
  Cross2Icon
} from "@radix-ui/react-icons";
// Import our simplified dropdown menu
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
// Use a try-catch for date-fns import to handle potential missing dependency
let format: (date: Date | number, format: string) => string;
try {
  const dateFns = require('date-fns');
  format = dateFns.format;
} catch (e) {
  // Fallback format function if date-fns is not available
  format = (date: Date | number, formatStr: string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };
}

interface EventListProps {
  events: any[];
  onEventClick: (eventId: string) => void;
  getDealName: (dealId: string) => string;
  onToggleComplete?: (eventId: string) => void;
}

export default function EventList({ events, onEventClick, getDealName, onToggleComplete }: EventListProps) {
  const [sortField, setSortField] = useState<string>('start');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState<string>('all');
  const [showPastEvents, setShowPastEvents] = useState<boolean>(false);

  // Sort events
  const sortedEvents = [...events].sort((a, b) => {
    let aValue, bValue;

    if (sortField === 'start') {
      aValue = new Date(a.start).getTime();
      bValue = new Date(b.start).getTime();
    } else if (sortField === 'title') {
      aValue = a.title.toLowerCase();
      bValue = b.title.toLowerCase();
    } else if (sortField === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      aValue = priorityOrder[a.extendedProps?.priority || 'low'];
      bValue = priorityOrder[b.extendedProps?.priority || 'low'];
    } else if (sortField === 'type') {
      aValue = a.extendedProps?.event_type || '';
      bValue = b.extendedProps?.event_type || '';
    } else {
      aValue = a[sortField];
      bValue = b[sortField];
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Separate current and past events
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const currentEvents = sortedEvents.filter(event => {
    const eventDate = new Date(event.start);
    return eventDate >= now || event.extendedProps?.completed;
  });

  const pastEvents = sortedEvents.filter(event => {
    const eventDate = new Date(event.start);
    return eventDate < now && !event.extendedProps?.completed;
  });

  // Filter events
  const filterEvents = (events: any[]) => {
    return events.filter(event => {
      if (filter === 'all') return true;
      if (filter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const eventDate = new Date(event.start);
        return eventDate >= today && eventDate < tomorrow;
      }
      if (filter === 'upcoming') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const eventDate = new Date(event.start);
        return eventDate >= today && eventDate < nextWeek;
      }
      if (filter === 'high') return event.extendedProps?.priority === 'high';
      if (filter === 'deadline') return event.extendedProps?.event_type === 'deadline';
      if (filter === 'completed') return event.extendedProps?.completed;

      return true;
    });
  };

  const filteredCurrentEvents = filterEvents(currentEvents);
  const filteredPastEvents = filterEvents(pastEvents);

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case 'low':
        return <Badge className="bg-blue-500">Low</Badge>;
      default:
        return <Badge className="bg-gray-500">Normal</Badge>;
    }
  };

  // Get event type icon
  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'deadline':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'lifecycle':
        return <InfoCircledIcon className="h-4 w-4 text-green-500" />;
      default:
        return <CalendarIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'MMM dd, yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  // Format time
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'HH:mm');
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="rounded-xl p-4 shadow-lg mt-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Current Events ({filteredCurrentEvents.length})
        </h2>

        <div className="flex space-x-2">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center"
              onClick={() => {
                // Simple dropdown toggle
                const dropdown = document.getElementById('filter-dropdown');
                if (dropdown) {
                  dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
                }
              }}
            >
              <MixerHorizontalIcon className="h-4 w-4 mr-2" />
              Filter: {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Button>

            <div
              id="filter-dropdown"
              className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50"
              style={{ display: 'none' }}
            >
              <div className="py-1" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    setFilter('all');
                    document.getElementById('filter-dropdown')!.style.display = 'none';
                  }}
                >
                  <span className="flex items-center">
                    <CheckIcon className={`h-4 w-4 mr-2 ${filter === 'all' ? 'opacity-100' : 'opacity-0'}`} />
                    All Events
                  </span>
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    setFilter('today');
                    document.getElementById('filter-dropdown')!.style.display = 'none';
                  }}
                >
                  <span className="flex items-center">
                    <CheckIcon className={`h-4 w-4 mr-2 ${filter === 'today' ? 'opacity-100' : 'opacity-0'}`} />
                    Today
                  </span>
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    setFilter('upcoming');
                    document.getElementById('filter-dropdown')!.style.display = 'none';
                  }}
                >
                  <span className="flex items-center">
                    <CheckIcon className={`h-4 w-4 mr-2 ${filter === 'upcoming' ? 'opacity-100' : 'opacity-0'}`} />
                    Upcoming (7 days)
                  </span>
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    setFilter('high');
                    document.getElementById('filter-dropdown')!.style.display = 'none';
                  }}
                >
                  <span className="flex items-center">
                    <CheckIcon className={`h-4 w-4 mr-2 ${filter === 'high' ? 'opacity-100' : 'opacity-0'}`} />
                    High Priority
                  </span>
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    setFilter('deadline');
                    document.getElementById('filter-dropdown')!.style.display = 'none';
                  }}
                >
                  <span className="flex items-center">
                    <CheckIcon className={`h-4 w-4 mr-2 ${filter === 'deadline' ? 'opacity-100' : 'opacity-0'}`} />
                    Deadlines
                  </span>
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    setFilter('completed');
                    document.getElementById('filter-dropdown')!.style.display = 'none';
                  }}
                >
                  <span className="flex items-center">
                    <CheckIcon className={`h-4 w-4 mr-2 ${filter === 'completed' ? 'opacity-100' : 'opacity-0'}`} />
                    Completed
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: 'var(--bg-card-hover)' }}>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead
                className="cursor-pointer transition-colors hover:text-accent"
                onClick={() => handleSort('title')}
                style={{ color: sortField === 'title' ? 'var(--accent)' : 'var(--text-primary)' }}
              >
                Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer transition-colors hover:text-accent"
                onClick={() => handleSort('start')}
                style={{ color: sortField === 'start' ? 'var(--accent)' : 'var(--text-primary)' }}
              >
                Date {sortField === 'start' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer transition-colors hover:text-accent"
                onClick={() => handleSort('priority')}
                style={{ color: sortField === 'priority' ? 'var(--accent)' : 'var(--text-primary)' }}
              >
                Priority {sortField === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead style={{ color: 'var(--text-primary)' }}>Deal</TableHead>
              <TableHead className="w-[80px]" style={{ color: 'var(--text-primary)' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCurrentEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  No events found
                </TableCell>
              </TableRow>
            ) : (
              filteredCurrentEvents.map((event) => (
                <TableRow
                  key={event.id}
                  className={`hover:bg-opacity-50 transition-colors ${event.extendedProps?.completed ? 'opacity-70' : ''}`}
                  style={{
                    backgroundColor: event.extendedProps?.completed ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                  }}
                >
                  <TableCell onClick={() => onEventClick(event.id)} className="cursor-pointer">
                    {getEventTypeIcon(event.extendedProps?.event_type || 'custom')}
                  </TableCell>
                  <TableCell
                    className={`font-medium cursor-pointer ${event.extendedProps?.completed ? 'line-through' : ''}`}
                    style={{ color: 'var(--text-primary)' }}
                    onClick={() => onEventClick(event.id)}
                  >
                    {event.title}
                    {event.extendedProps?.description && (
                      <div className={`text-xs mt-1 ${event.extendedProps?.completed ? 'line-through' : ''}`} style={{ color: 'var(--text-muted)' }}>
                        {event.extendedProps.description.length > 60
                          ? `${event.extendedProps.description.substring(0, 60)}...`
                          : event.extendedProps.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell onClick={() => onEventClick(event.id)} className="cursor-pointer">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" style={{ color: 'var(--text-muted)' }} />
                      <span className={event.extendedProps?.completed ? 'line-through' : ''}>{formatDate(event.start)}</span>
                    </div>
                    {!event.allDay && (
                      <div className="flex items-center text-xs mt-1">
                        <ClockIcon className="h-3 w-3 mr-1" style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-muted)' }} className={event.extendedProps?.completed ? 'line-through' : ''}>
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell onClick={() => onEventClick(event.id)} className="cursor-pointer">
                    {getPriorityBadge(event.extendedProps?.priority || 'normal')}
                  </TableCell>
                  <TableCell onClick={() => onEventClick(event.id)} className="cursor-pointer">
                    {event.extendedProps?.deal_id ? (
                      <span style={{ color: 'var(--accent)' }} className={event.extendedProps?.completed ? 'line-through' : ''}>
                        {getDealName(event.extendedProps.deal_id)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`p-1 rounded-full transition-all duration-300 ${
                          event.extendedProps?.completed
                            ? 'bg-green-100 dark:bg-green-900 scale-110'
                            : 'hover:bg-green-100 dark:hover:bg-green-900'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add animation class to the row
                          const row = e.currentTarget.closest('tr');
                          if (row && !event.extendedProps?.completed) {
                            row.classList.add('animate-complete-task');
                            // Wait for animation to complete before toggling
                            setTimeout(() => {
                              if (onToggleComplete) {
                                onToggleComplete(event.id);
                              }
                            }, 500);
                          } else if (onToggleComplete) {
                            onToggleComplete(event.id);
                          }
                        }}
                      >
                        <CheckIcon
                          className={`h-4 w-4 transition-all duration-300 ${
                            event.extendedProps?.completed ? 'scale-125' : ''
                          }`}
                          style={{ color: event.extendedProps?.completed ? 'var(--accent)' : 'var(--text-muted)' }}
                        />
                      </Button>
                      {event.extendedProps?.completed && (
                        <span className="absolute inset-0 animate-ping-once rounded-full bg-green-400 opacity-30"></span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Past Events Section */}
      {filteredPastEvents.length > 0 && (
        <div className="mt-8">
          <div
            className="flex justify-between items-center mb-4 p-2 rounded cursor-pointer hover:bg-opacity-50 transition-colors"
            style={{ backgroundColor: 'var(--bg-card-hover)' }}
            onClick={() => setShowPastEvents(!showPastEvents)}
          >
            <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              Past Events ({filteredPastEvents.length})
            </h3>
            <Button variant="ghost" size="sm" className="p-1">
              {showPastEvents ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              )}
            </Button>
          </div>

          {showPastEvents && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead style={{ color: 'var(--text-primary)' }}>Title</TableHead>
                    <TableHead style={{ color: 'var(--text-primary)' }}>Date</TableHead>
                    <TableHead style={{ color: 'var(--text-primary)' }}>Priority</TableHead>
                    <TableHead style={{ color: 'var(--text-primary)' }}>Deal</TableHead>
                    <TableHead className="w-[80px]" style={{ color: 'var(--text-primary)' }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPastEvents.map((event) => (
                    <TableRow
                      key={event.id}
                      className="hover:bg-opacity-50 transition-colors"
                      style={{ backgroundColor: 'var(--bg-card)' }}
                    >
                      <TableCell onClick={() => onEventClick(event.id)} className="cursor-pointer">
                        {getEventTypeIcon(event.extendedProps?.event_type || 'custom')}
                      </TableCell>
                      <TableCell
                        className="font-medium cursor-pointer"
                        style={{ color: 'var(--text-muted)' }}
                        onClick={() => onEventClick(event.id)}
                      >
                        {event.title}
                        {event.extendedProps?.description && (
                          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                            {event.extendedProps.description.length > 60
                              ? `${event.extendedProps.description.substring(0, 60)}...`
                              : event.extendedProps.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell onClick={() => onEventClick(event.id)} className="cursor-pointer text-muted-foreground">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" style={{ color: 'var(--text-muted)' }} />
                          <span>{formatDate(event.start)}</span>
                        </div>
                        {!event.allDay && (
                          <div className="flex items-center text-xs mt-1">
                            <ClockIcon className="h-3 w-3 mr-1" style={{ color: 'var(--text-muted)' }} />
                            <span style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                              {formatTime(event.start)} - {formatTime(event.end)}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell onClick={() => onEventClick(event.id)} className="cursor-pointer">
                        {getPriorityBadge(event.extendedProps?.priority || 'normal')}
                      </TableCell>
                      <TableCell onClick={() => onEventClick(event.id)} className="cursor-pointer">
                        {event.extendedProps?.deal_id ? (
                          <span style={{ color: 'var(--accent)', opacity: 0.7 }}>
                            {getDealName(event.extendedProps.deal_id)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded-full transition-all duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add animation class to the row
                              const row = e.currentTarget.closest('tr');
                              if (row) {
                                row.classList.add('animate-complete-task');
                                // Wait for animation to complete before toggling
                                setTimeout(() => {
                                  if (onToggleComplete) {
                                    onToggleComplete(event.id);
                                  }
                                }, 500);
                              }
                            }}
                          >
                            <CheckIcon className="h-4 w-4 transition-all duration-300" style={{ color: 'var(--text-muted)' }} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
