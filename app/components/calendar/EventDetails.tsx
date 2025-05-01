'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../ui/dialog';
import { Button } from '../ui/button';
import { CalendarEvent } from '../../hooks/useCalendarEvents';
import { 
  CalendarIcon, 
  ClockIcon, 
  ExclamationTriangleIcon, 
  InfoCircledIcon, 
  CheckCircledIcon,
  BellIcon,
  PersonIcon,
  BuildingIcon,
  TimerIcon
} from '@radix-ui/react-icons';
import EventModal from '../EventModal';

interface EventDetailsProps {
  event: CalendarEvent;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  dealName?: string;
  assignedToName?: string;
}

export default function EventDetails({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  dealName,
  assignedToName
}: EventDetailsProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  // Helper function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-blue-500';
      default:
        return '';
    }
  };

  // Helper function to get event type icon and color
  const getEventTypeInfo = (type: string) => {
    switch (type) {
      case 'custom':
        return { 
          icon: <CalendarIcon className="h-5 w-5 mr-2" />, 
          color: 'text-accent',
          label: 'Custom Event'
        };
      case 'lifecycle':
        return { 
          icon: <TimerIcon className="h-5 w-5 mr-2" />, 
          color: 'text-green-500',
          label: 'Lifecycle Event'
        };
      case 'deadline':
        return { 
          icon: <ExclamationTriangleIcon className="h-5 w-5 mr-2" />, 
          color: 'text-red-500',
          label: 'Deadline'
        };
      default:
        return { 
          icon: <CalendarIcon className="h-5 w-5 mr-2" />, 
          color: '',
          label: 'Event'
        };
    }
  };

  // Format dates for display
  const formatEventDate = (dateString: string, allDay: boolean) => {
    const date = parseISO(dateString);
    return allDay 
      ? format(date, 'MMMM d, yyyy') 
      : format(date, 'MMMM d, yyyy h:mm a');
  };

  // Get event type info
  const eventTypeInfo = getEventTypeInfo(event.event_type || 'custom');

  return (
    <>
      <Dialog open={isOpen && !showEditModal} onOpenChange={onClose}>
        <DialogContent className="max-w-md" style={{ 
          backgroundColor: 'var(--bg-card)', 
          borderColor: 'var(--border-dark)',
          color: 'var(--text-primary)'
        }}>
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <div className={`${eventTypeInfo.color} mr-2`}>
                {eventTypeInfo.icon}
              </div>
              <span>{event.title}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Event Type & Priority */}
            <div className="flex items-center justify-between">
              <div className={`flex items-center ${eventTypeInfo.color}`}>
                {eventTypeInfo.icon}
                <span>{eventTypeInfo.label}</span>
              </div>
              <div className={`flex items-center ${getPriorityColor(event.priority)}`}>
                <CheckCircledIcon className="h-4 w-4 mr-1" />
                <span className="capitalize">{event.priority} Priority</span>
              </div>
            </div>

            {/* Date & Time */}
            <div className="space-y-2 p-3 rounded-md" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span className="font-medium">
                  {formatEventDate(event.start, event.all_day || false)}
                </span>
              </div>
              {!event.all_day && (
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  <span>
                    {format(parseISO(event.start), 'h:mm a')} - {format(parseISO(event.end), 'h:mm a')}
                  </span>
                </div>
              )}
              {event.all_day && (
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  <span>All day</span>
                </div>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div className="space-y-1">
                <h3 className="text-sm font-medium flex items-center" style={{ color: 'var(--text-muted)' }}>
                  <InfoCircledIcon className="h-4 w-4 mr-1" />
                  Description
                </h3>
                <p className="text-sm whitespace-pre-line p-3 rounded-md" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                  {event.description}
                </p>
              </div>
            )}

            {/* Related Deal */}
            {dealName && (
              <div className="space-y-1">
                <h3 className="text-sm font-medium flex items-center" style={{ color: 'var(--text-muted)' }}>
                  <BuildingIcon className="h-4 w-4 mr-1" />
                  Related Deal
                </h3>
                <p className="text-sm p-3 rounded-md" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                  {dealName}
                </p>
              </div>
            )}

            {/* Assigned To */}
            {assignedToName && (
              <div className="space-y-1">
                <h3 className="text-sm font-medium flex items-center" style={{ color: 'var(--text-muted)' }}>
                  <PersonIcon className="h-4 w-4 mr-1" />
                  Assigned To
                </h3>
                <p className="text-sm p-3 rounded-md" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                  {assignedToName}
                </p>
              </div>
            )}

            {/* Reminder */}
            {event.reminder && (
              <div className="space-y-1">
                <h3 className="text-sm font-medium flex items-center" style={{ color: 'var(--text-muted)' }}>
                  <BellIcon className="h-4 w-4 mr-1" />
                  Reminder
                </h3>
                <p className="text-sm p-3 rounded-md" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                  {event.reminder === '1h' && 'Reminder 1 hour before'}
                  {event.reminder === '1d' && 'Reminder 1 day before'}
                  {event.reminder === '3d' && 'Reminder 3 days before'}
                  {event.reminder === '1w' && 'Reminder 1 week before'}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => onDelete(event.id)}
              className="mr-auto"
            >
              Delete
            </Button>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Close
              </Button>
              <Button
                onClick={() => setShowEditModal(true)}
                className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to hover:shadow-accent-glow"
                style={{ color: 'var(--button-text)' }}
              >
                Edit
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      {showEditModal && (
        <EventModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            onClose();
          }}
          onSave={(updatedEvent) => {
            onEdit({ ...event, ...updatedEvent });
            setShowEditModal(false);
            onClose();
          }}
          onDelete={() => {
            onDelete(event.id);
            setShowEditModal(false);
            onClose();
          }}
          event={event}
          mode="edit"
        />
      )}
    </>
  );
}
