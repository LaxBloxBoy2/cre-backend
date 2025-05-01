'use client';

import { useState, useEffect } from 'react';
import { useCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent, mapToCalendarEvents } from '@/hooks/useCalendar';
import { format, parseISO, addMonths, subMonths } from 'date-fns';

export default function CalendarPage() {
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'MMMM yyyy'));

  // Fetch calendar events with React Query
  const { data, isLoading, error } = useCalendarEvents();

  // Calendar event mutations
  const createEventMutation = useCreateCalendarEvent();
  const updateEventMutation = useUpdateCalendarEvent();
  const deleteEventMutation = useDeleteCalendarEvent();

  // Update current month when date changes
  useEffect(() => {
    setCurrentMonth(format(currentDate, 'MMMM yyyy'));
  }, [currentDate]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };

  // Get days in current month
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  // Get day of week for first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, 1).getDay();
  };

  // Generate days array for current month
  const days = Array.from({ length: getDaysInMonth() }, (_, i) => i + 1);

  // Generate empty cells for days before the 1st of the month
  const emptyCells = Array.from({ length: getFirstDayOfMonth() }, (_, i) => i);

  // Helper function to get events for a specific day
  const getEventsForDay = (day: number) => {
    if (!data?.events) return [];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];

    return data.events.filter(event => {
      const eventDate = event.start.split('T')[0];
      return eventDate === dateStr;
    });
  };

  // Get today's date
  const today = new Date();
  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  // Handle adding a new event
  const handleAddEvent = () => {
    // In a real app, this would open a modal to create a new event
    alert('This would open an event creation modal in a real app');
  };

  // Get event type class
  const getEventTypeClass = (eventType?: string, priority?: string) => {
    if (!eventType && !priority) return 'bg-dark-card-hover text-text-secondary';

    if (eventType === 'custom') return 'bg-dark-card-hover text-text-secondary';
    if (eventType === 'lifecycle') return 'bg-info/20 text-info';
    if (eventType === 'deadline') return 'bg-warning/20 text-warning';

    if (priority === 'high') return 'bg-error/20 text-error';
    if (priority === 'medium') return 'bg-warning/20 text-warning';
    if (priority === 'low') return 'bg-success/20 text-success';

    return 'bg-dark-card-hover text-text-secondary';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 bg-dark-card-hover text-text-secondary rounded-md hover:text-white transition-all duration-200"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </button>
          <button
            className="px-4 py-2 bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white rounded-md hover:shadow-accent-glow transition-all duration-200"
            onClick={handleAddEvent}
          >
            Add Event
          </button>
        </div>
      </div>

      <div className="bg-dark-card rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-dark-border flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              className="text-text-secondary hover:text-white transition-colors"
              onClick={goToPreviousMonth}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-white">{currentMonth}</h2>
            <button
              className="text-text-secondary hover:text-white transition-colors"
              onClick={goToNextMonth}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 rounded-md text-sm ${
                view === 'month'
                  ? 'bg-dark-card-hover text-accent'
                  : 'text-text-secondary hover:text-white hover:bg-dark-card-hover/50'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 rounded-md text-sm ${
                view === 'week'
                  ? 'bg-dark-card-hover text-accent'
                  : 'text-text-secondary hover:text-white hover:bg-dark-card-hover/50'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1 rounded-md text-sm ${
                view === 'day'
                  ? 'bg-dark-card-hover text-accent'
                  : 'text-text-secondary hover:text-white hover:bg-dark-card-hover/50'
              }`}
            >
              Day
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading calendar events...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-error">
            <p>Error loading calendar events. Please try again.</p>
          </div>
        ) : (
          <div className="p-4">
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center text-text-secondary text-sm font-medium">
                  {day}
                </div>
              ))}

              {/* Empty cells for days before the 1st of the month */}
              {emptyCells.map((i) => (
                <div key={`empty-${i}`} className="p-2 h-32 bg-dark-bg rounded-md"></div>
              ))}

              {/* Calendar days */}
              {days.map((day) => {
                const dayEvents = getEventsForDay(day);
                return (
                  <div
                    key={day}
                    className={`p-2 bg-dark-bg rounded-md h-32 overflow-hidden hover:bg-dark-card-hover transition-colors ${
                      isToday(day) ? 'ring-1 ring-accent' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-sm font-medium ${isToday(day) ? 'text-accent' : 'text-white'}`}>
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-xs text-text-secondary">{dayEvents.length} events</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`px-2 py-1 text-xs rounded truncate ${getEventTypeClass(event.event_type, event.priority)}`}
                          onClick={() => {
                            // In a real app, this would open a modal to view/edit the event
                            alert(`This would open a modal to view/edit event: ${event.title}`);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Upcoming events */}
      <div className="bg-dark-card rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <h2 className="text-lg font-semibold text-white">Upcoming Events</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading events...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-error">
            <p>Error loading events. Please try again.</p>
          </div>
        ) : !data?.events || data.events.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">
            <p>No upcoming events found.</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-border">
            {data.events
              .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
              .slice(0, 5)
              .map((event) => (
                <div key={event.id} className="p-4 hover:bg-dark-card-hover transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className={`mt-0.5 p-1.5 rounded-full ${getEventTypeClass(event.event_type, event.priority)}`}>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">{event.title}</h3>
                      {event.description && (
                        <p className="text-xs text-text-secondary mt-1">{event.description}</p>
                      )}
                      <p className="text-xs text-text-secondary mt-1">
                        {format(parseISO(event.start), 'EEEE, MMMM d, yyyy')}
                        {event.all_day ? ' (All day)' : ` at ${format(parseISO(event.start), 'h:mm a')}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
