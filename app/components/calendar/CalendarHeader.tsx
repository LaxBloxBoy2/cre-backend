'use client';

import { Button } from '../ui/button';
import { 
  CalendarIcon, 
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon
} from '@radix-ui/react-icons';
import { Input } from '../ui/input';
import { useState } from 'react';

interface CalendarHeaderProps {
  viewType: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
  onViewChange: (viewType: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => void;
  onAddEvent: () => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  title: string;
  onSearch?: (query: string) => void;
}

export default function CalendarHeader({
  viewType,
  onViewChange,
  onAddEvent,
  onNavigate,
  title,
  onSearch
}: CalendarHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          <CalendarIcon className="inline-block mr-2 h-6 w-6" />
          {title}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        {onSearch && (
          <form onSubmit={handleSearch} className="relative mr-2">
            <Input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40 md:w-60 pl-8"
              style={{ 
                backgroundColor: 'var(--bg-card-hover)', 
                borderColor: 'var(--border-dark)',
                color: 'var(--text-primary)'
              }}
            />
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          </form>
        )}

        {/* Navigation */}
        <div className="flex items-center mr-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('today')}
            className="rounded-l-md rounded-r-none"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('prev')}
            className="rounded-none border-l-0 border-r-0"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('next')}
            className="rounded-r-md rounded-l-none"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* View Switcher */}
        <div className="flex items-center mr-2">
          <Button
            variant={viewType === 'dayGridMonth' ? 'default' : 'outline'}
            onClick={() => onViewChange('dayGridMonth')}
            className={`rounded-l-md rounded-r-none ${viewType === 'dayGridMonth' ? 'bg-accent' : ''}`}
            style={{ color: viewType === 'dayGridMonth' ? 'var(--button-text)' : 'var(--text-primary)' }}
          >
            Month
          </Button>
          <Button
            variant={viewType === 'timeGridWeek' ? 'default' : 'outline'}
            onClick={() => onViewChange('timeGridWeek')}
            className={`rounded-none border-l-0 border-r-0 ${viewType === 'timeGridWeek' ? 'bg-accent' : ''}`}
            style={{ color: viewType === 'timeGridWeek' ? 'var(--button-text)' : 'var(--text-primary)' }}
          >
            Week
          </Button>
          <Button
            variant={viewType === 'timeGridDay' ? 'default' : 'outline'}
            onClick={() => onViewChange('timeGridDay')}
            className={`rounded-r-md rounded-l-none ${viewType === 'timeGridDay' ? 'bg-accent' : ''}`}
            style={{ color: viewType === 'timeGridDay' ? 'var(--button-text)' : 'var(--text-primary)' }}
          >
            Day
          </Button>
        </div>

        {/* Add Event Button */}
        <Button
          variant="default"
          onClick={onAddEvent}
          className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to hover:shadow-accent-glow"
          style={{ color: 'var(--button-text)' }}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>
    </div>
  );
}
