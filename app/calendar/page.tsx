'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, DateSelectArg, EventChangeArg } from '@fullcalendar/core';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import EventModal from '../components/EventModal';
import CalendarHeader from '../components/calendar/CalendarHeader';
import CalendarFilters from '../components/calendar/CalendarFilters';
import EventList from '../components/calendar/EventList';
import {
  useCalendarEvents,
  useDealLifecycleEvents,
  useAlertDeadlines,
  useDeals,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
  useToggleEventCompletion,
  mapToCalendarEvents,
  CalendarEvent
} from '../hooks/useCalendarEvents';

export default function CalendarPage() {
  // Get theme context
  const { theme } = useTheme();

  // State
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filters, setFilters] = useState({
    dealId: 'all',
    priority: 'all',
    eventType: 'all',
    searchQuery: ''
  });
  const [viewType, setViewType] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');

  const [calendarTitle, setCalendarTitle] = useState('Calendar');

  // Refs
  const calendarRef = useRef<any>(null);

  // Hooks
  const { showToast } = useToast();
  const { data: calendarEventsData, isLoading: eventsLoading } = useCalendarEvents();
  const { data: lifecycleEvents, isLoading: lifecycleLoading } = useDealLifecycleEvents(filters.dealId !== 'all' ? filters.dealId : '');
  const { data: alertEvents, isLoading: alertsLoading } = useAlertDeadlines();
  const { data: deals } = useDeals();
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();
  const toggleEventCompletion = useToggleEventCompletion();

  // Combine all events with fallback data
  const allEvents = [
    ...(calendarEventsData?.events ? mapToCalendarEvents(calendarEventsData.events) : []),
    ...(lifecycleEvents || []),
    ...(alertEvents || [])
  ];

  // If all data is loading and no events are available, use fallback events
  if (eventsLoading && lifecycleLoading && alertsLoading && allEvents.length === 0) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    allEvents.push(
      {
        id: 'fallback-1',
        title: 'Due Diligence Deadline',
        start: tomorrow.toISOString(),
        end: tomorrow.toISOString(),
        allDay: true,
        extendedProps: {
          description: 'Complete all due diligence tasks by this date',
          deal_id: '1',
          priority: 'high',
          event_type: 'deadline'
        },
        backgroundColor: '#EF4444',
        borderColor: '#EF4444'
      },
      {
        id: 'fallback-2',
        title: 'Investor Meeting',
        start: nextWeek.toISOString(),
        end: nextWeek.toISOString(),
        allDay: false,
        extendedProps: {
          description: 'Present deal to potential investors',
          deal_id: '1',
          priority: 'medium',
          event_type: 'custom'
        },
        backgroundColor: '#F59E0B',
        borderColor: '#F59E0B'
      }
    );
  }

  // Filter events
  const filteredEvents = allEvents.filter(event => {
    if (filters.dealId && filters.dealId !== 'all' && event.extendedProps?.deal_id !== filters.dealId) {
      return false;
    }

    if (filters.priority && filters.priority !== 'all' && event.extendedProps?.priority !== filters.priority) {
      return false;
    }

    if (filters.eventType && filters.eventType !== 'all' && event.extendedProps?.event_type !== filters.eventType) {
      return false;
    }

    if (filters.searchQuery && event.title && !event.title.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Set initial calendar title when component mounts
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      setCalendarTitle(calendarApi.view.title);
    }
  }, []);

  // Calculate event counts for filters
  const eventCounts: {
    total: number;
    byDeal: Record<string, number>;
    byPriority: Record<string, number>;
    byEventType: Record<string, number>;
  } = {
    total: allEvents.length,
    byDeal: { all: allEvents.length },
    byPriority: { all: allEvents.length },
    byEventType: { all: allEvents.length }
  };

  // Count events by deal
  allEvents.forEach(event => {
    const dealId = event.extendedProps?.deal_id as string;
    if (dealId) {
      eventCounts.byDeal[dealId] = (eventCounts.byDeal[dealId] || 0) + 1;
    }
  });

  // Count events by priority
  allEvents.forEach(event => {
    const priority = event.extendedProps?.priority as string;
    if (priority) {
      eventCounts.byPriority[priority] = (eventCounts.byPriority[priority] || 0) + 1;
    }
  });

  // Count events by event type
  allEvents.forEach(event => {
    const eventType = event.extendedProps?.event_type as string;
    if (eventType) {
      eventCounts.byEventType[eventType] = (eventCounts.byEventType[eventType] || 0) + 1;
    }
  });

  // Handle event click
  const handleEventClick = (arg: EventClickArg) => {
    const eventId = arg.event.id;
    const event = calendarEventsData?.events.find((e: CalendarEvent) => e.id === eventId);

    if (event) {
      setSelectedEvent(event);
      setModalMode('edit');
      setIsModalOpen(true);
    } else {
      // Handle system-generated events (lifecycle, alerts)
      const eventData = {
        id: eventId,
        title: arg.event.title,
        start: arg.event.startStr,
        end: arg.event.endStr,
        description: arg.event.extendedProps?.description || '',
        deal_id: arg.event.extendedProps?.deal_id,
        priority: arg.event.extendedProps?.priority || 'medium',
        event_type: arg.event.extendedProps?.event_type || 'custom',
        all_day: arg.event.allDay,
        created_at: arg.event.extendedProps?.created_at || new Date().toISOString(),
        updated_at: arg.event.extendedProps?.updated_at || new Date().toISOString(),
        created_by: arg.event.extendedProps?.created_by || 'System'
      };

      setSelectedEvent(eventData as CalendarEvent);
      setModalMode('edit');
      setIsModalOpen(true);
    }
  };

  // Handle date select
  const handleDateSelect = (arg: DateSelectArg) => {
    setSelectedDate(arg.start);
    setModalMode('create');
    setIsModalOpen(true);
  };

  // Handle event drag and drop
  const handleEventChange = (arg: EventChangeArg) => {
    const eventId = arg.event.id;
    const event = calendarEventsData?.events.find((e: CalendarEvent) => e.id === eventId);

    if (event) {
      updateEvent.mutate({
        eventId,
        data: {
          start: arg.event.startStr,
          end: arg.event.endStr,
          all_day: arg.event.allDay
        }
      }, {
        onSuccess: () => {
          showToast('Event updated successfully', 'success');
        },
        onError: () => {
          showToast('Failed to update event', 'error');
          arg.revert();
        }
      });
    } else {
      // Can't update system events
      showToast('System events cannot be modified', 'warning');
      arg.revert();
    }
  };

  // Handle create event
  const handleCreateEvent = (eventData: any) => {
    createEvent.mutate(eventData, {
      onSuccess: () => {
        showToast('Event created successfully', 'success');
      },
      onError: () => {
        showToast('Failed to create event', 'error');
      }
    });
  };

  // Handle update event
  const handleUpdateEvent = (eventData: any) => {
    if (!selectedEvent) return;

    updateEvent.mutate({
      eventId: selectedEvent.id,
      data: eventData
    }, {
      onSuccess: () => {
        showToast('Event updated successfully', 'success');
      },
      onError: () => {
        showToast('Failed to update event', 'error');
      }
    });
  };

  // Handle delete event
  const handleDeleteEvent = () => {
    if (!selectedEvent) return;

    deleteEvent.mutate(selectedEvent.id, {
      onSuccess: () => {
        showToast('Event deleted successfully', 'success');
        setIsModalOpen(false);
      },
      onError: () => {
        showToast('Failed to delete event', 'error');
      }
    });
  };

  // Handle save event (create or update)
  const handleSaveEvent = (eventData: any) => {
    if (modalMode === 'create') {
      handleCreateEvent(eventData);
    } else {
      handleUpdateEvent(eventData);
    }
  };

  // Get deal name by ID
  const getDealName = (dealId: string) => {
    if (!deals) return 'Unknown Deal';
    const deal = deals.find((d: any) => d.id === dealId);
    return deal ? deal.project_name : 'Unknown Deal';
  };

  // Handle filter changes - memoized to prevent infinite re-renders
  const handleFilterChange = useCallback((newFilters: {
    dealId: string;
    priority: string;
    eventType: string;
  }) => {
    setFilters(prev => ({
      ...prev,
      dealId: newFilters.dealId,
      priority: newFilters.priority,
      eventType: newFilters.eventType
    }));
  }, []);

  // Handle search query - memoized to prevent infinite re-renders
  const handleSearch = useCallback((query: string) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: query
    }));
  }, []);

  // Log the current theme for debugging
  useEffect(() => {
    console.log('Current theme:', theme);
  }, [theme]);

  return (
    <div className="p-6">
      <CalendarHeader
        viewType={viewType}
        onViewChange={(newViewType) => {
          setViewType(newViewType);
          if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            calendarApi.changeView(newViewType);
            setCalendarTitle(calendarApi.view.title);
          }
        }}
        onAddEvent={() => {
          setModalMode('create');
          setSelectedEvent(null);
          setSelectedDate(new Date());
          setIsModalOpen(true);
        }}
        onNavigate={(direction) => {
          if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            if (direction === 'prev') {
              calendarApi.prev();
            } else if (direction === 'next') {
              calendarApi.next();
            } else {
              calendarApi.today();
            }
            setCalendarTitle(calendarApi.view.title);
          }
        }}
        title={calendarTitle}
        onSearch={handleSearch}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="md:col-span-3 rounded-xl p-4 shadow-lg" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
          <div className="calendar-container">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={viewType}
              headerToolbar={false}
              datesSet={(dateInfo) => {
                setCalendarTitle(dateInfo.view.title);
              }}
              events={filteredEvents}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={false}
              weekends={true}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventChange={handleEventChange}
              editable={true}
              droppable={true}
              height="auto"
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
                hour12: false
              }}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              eventDidMount={(info) => {
                // Add tooltip
                const tooltip = document.createElement('div');
                tooltip.className = 'event-tooltip';
                tooltip.innerHTML = `
                  <div class="p-2 rounded-md shadow-lg" style="background-color: var(--bg-card); border: 1px solid var(--border-dark); color: var(--text-primary);">
                    <div class="font-medium">${info.event.title}</div>
                    ${info.event.extendedProps.description ? `<div class="text-sm mt-1" style="color: var(--text-muted);">${info.event.extendedProps.description}</div>` : ''}
                    ${info.event.extendedProps.deal_id ? `<div class="text-xs mt-1" style="color: var(--accent);">Deal: ${getDealName(info.event.extendedProps.deal_id)}</div>` : ''}
                  </div>
                `;

                const eventEl = info.el;
                eventEl.addEventListener('mouseover', () => {
                  document.body.appendChild(tooltip);
                  const rect = eventEl.getBoundingClientRect();
                  tooltip.style.position = 'absolute';
                  tooltip.style.top = `${rect.bottom + window.scrollY}px`;
                  tooltip.style.left = `${rect.left + window.scrollX}px`;
                  tooltip.style.zIndex = '1000';
                });

                eventEl.addEventListener('mouseout', () => {
                  if (document.body.contains(tooltip)) {
                    document.body.removeChild(tooltip);
                  }
                });
              }}
              // Theme-aware styling
              themeSystem="standard"
              dayCellClassNames="rounded-md overflow-hidden hover:opacity-90 transition-all duration-200"
              dayHeaderClassNames="font-medium"
              slotLabelClassNames=""
              eventClassNames="rounded-md overflow-hidden shadow-md transition-shadow duration-200"
              allDayClassNames=""
              moreLinkClassNames="hover:opacity-80"
              nowIndicatorClassNames=""
              slotLaneClassNames=""
              dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
            />
          </div>
        </div>

        <div className="md:col-span-1">
          <CalendarFilters
            onFilterChange={handleFilterChange}
            eventCounts={eventCounts}
          />
        </div>
      </div>

      {/* Event List */}
      <EventList
        events={filteredEvents}
        onEventClick={(eventId) => {
          const event = calendarEventsData?.events.find((e: CalendarEvent) => e.id === eventId);
          if (event) {
            setSelectedEvent(event);
            setModalMode('edit');
            setIsModalOpen(true);
          }
        }}
        getDealName={getDealName}
        onToggleComplete={(eventId) => {
          toggleEventCompletion.mutate(eventId, {
            onSuccess: () => {
              showToast('Event status updated', 'success');
            },
            onError: () => {
              showToast('Failed to update event status', 'error');
            }
          });
        }}
      />

      {/* Event Modal */}
      {isModalOpen && (
        <EventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveEvent}
          onDelete={modalMode === 'edit' ? handleDeleteEvent : undefined}
          event={selectedEvent || undefined}
          defaultDate={selectedDate || undefined}
          mode={modalMode}
        />
      )}

      {/* Custom styles for FullCalendar */}
      <style jsx global>{`
        .fc {
          --fc-border-color: var(--border-dark);
          --fc-page-bg-color: var(--bg-card);
          --fc-neutral-bg-color: var(--bg-card-hover);
          --fc-list-event-hover-bg-color: var(--bg-card-hover);
          --fc-today-bg-color: var(--hover-bg);
          --fc-event-border-color: transparent;
          --fc-now-indicator-color: var(--accent);
          height: 100%;
        }

        .fc-theme-standard td, .fc-theme-standard th {
          border-color: var(--border-dark);
        }

        .fc-theme-standard .fc-scrollgrid {
          border-color: var(--border-dark);
        }

        .fc-col-header-cell {
          padding: 8px 0;
        }

        .fc-daygrid-day-number, .fc-col-header-cell-cushion {
          color: var(--text-primary);
          text-decoration: none !important;
        }

        .fc-daygrid-day.fc-day-today {
          background-color: var(--hover-bg);
        }

        .fc-event {
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          margin-bottom: 2px;
          padding: 2px 4px;
        }

        .fc-event:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-neon);
          background-color: rgba(0, 201, 154, 0.2) !important;
        }

        /* Completed event styling */
        .completed-event {
          text-decoration: line-through;
          opacity: 0.7;
        }

        /* Improve day cell styling for expandable days */
        .fc-daygrid-day-events {
          padding: 2px;
          margin-top: 2px;
        }

        .fc-daygrid-day-bottom {
          padding-top: 2px;
          padding-bottom: 2px;
        }

        /* Add drag handle for day cells */
        .fc-daygrid-day-frame {
          position: relative;
        }

        .fc-daygrid-day-frame::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 30px;
          height: 4px;
          background-color: var(--border-dark);
          border-radius: 2px;
          opacity: 0.5;
          transition: all 0.2s ease;
          cursor: ns-resize;
        }

        .fc-daygrid-day-frame:hover::after {
          opacity: 1;
          background-color: var(--accent);
          height: 5px;
          width: 40px;
        }

        .fc-daygrid-more-link {
          background-color: var(--bg-card-hover);
          border-radius: 4px;
          padding: 2px 4px;
          margin: 2px 0;
          font-size: 0.8em;
          color: var(--accent);
          font-weight: 500;
          display: inline-block;
        }

        .fc-timegrid-slot, .fc-timegrid-axis {
          height: 48px !important;
        }

        .fc-timegrid-slot-label-cushion {
          color: var(--text-muted);
        }

        .fc-timegrid-now-indicator-line {
          border-color: var(--accent);
        }

        .fc-timegrid-now-indicator-arrow {
          border-color: var(--accent);
          border-top-color: transparent;
          border-bottom-color: transparent;
        }

        .fc-more-popover {
          background-color: var(--bg-card);
          border-color: var(--border-dark);
          border-radius: 8px;
          box-shadow: var(--card-shadow);
          padding: 0;
          overflow: hidden;
        }

        .fc-more-popover .fc-popover-title {
          color: var(--text-primary);
          background-color: var(--bg-card-hover);
          padding: 8px 12px;
          font-weight: 600;
          border-bottom: 1px solid var(--border-dark);
        }

        .fc-more-popover .fc-popover-body {
          padding: 8px;
          max-height: 300px;
          overflow-y: auto;
        }

        /* Style for events in the popover */
        .fc-more-popover .fc-daygrid-event-harness {
          margin-bottom: 4px;
        }

        .event-tooltip {
          z-index: 1000;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
