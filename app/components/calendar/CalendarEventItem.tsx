'use client';

import { useState, useRef, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  CalendarIcon, 
  ClockIcon, 
  ExclamationTriangleIcon, 
  TimerIcon,
  BellIcon,
  PersonIcon,
  BuildingIcon
} from '@radix-ui/react-icons';
import { CalendarEvent } from '../../hooks/useCalendarEvents';
import ContextMenu from './ContextMenu';
import EventDetails from './EventDetails';

interface CalendarEventItemProps {
  event: CalendarEvent;
  dealName?: string;
  assignedToName?: string;
  onEdit: (event: CalendarEvent) => void;
  onDuplicate: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
}

export default function CalendarEventItem({
  event,
  dealName,
  assignedToName,
  onEdit,
  onDuplicate,
  onDelete
}: CalendarEventItemProps) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showDetails, setShowDetails] = useState(false);
  const eventRef = useRef<HTMLDivElement>(null);

  // Get event type icon
  const getEventTypeIcon = () => {
    switch (event.event_type) {
      case 'lifecycle':
        return <TimerIcon className="h-4 w-4" />;
      case 'deadline':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  // Get priority color
  const getPriorityColor = () => {
    switch (event.priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get event type color
  const getEventTypeColor = () => {
    switch (event.event_type) {
      case 'lifecycle':
        return 'bg-green-500';
      case 'deadline':
        return 'bg-red-500';
      default:
        return 'bg-accent';
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), 'h:mm a');
  };

  // Handle right click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // Handle click
  const handleClick = () => {
    setShowDetails(true);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (eventRef.current && !eventRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <div 
        ref={eventRef}
        className="rounded-md p-2 mb-2 cursor-pointer hover:shadow-md transition-shadow"
        style={{ 
          backgroundColor: 'var(--bg-card)',
          borderLeft: `4px solid ${event.priority === 'high' ? '#EF4444' : event.priority === 'medium' ? '#F59E0B' : '#3B82F6'}`,
          color: 'var(--text-primary)'
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-medium text-sm">{event.title}</h3>
            
            <div className="flex items-center mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <ClockIcon className="h-3 w-3 mr-1" />
              {event.all_day ? (
                <span>All day</span>
              ) : (
                <span>{formatTime(event.start)} - {formatTime(event.end)}</span>
              )}
            </div>
            
            {dealName && (
              <div className="flex items-center mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <BuildingIcon className="h-3 w-3 mr-1" />
                <span>{dealName}</span>
              </div>
            )}
            
            {assignedToName && (
              <div className="flex items-center mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <PersonIcon className="h-3 w-3 mr-1" />
                <span>{assignedToName}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end space-y-1">
            <div className={`rounded-full p-1 ${getEventTypeColor()}`}>
              {getEventTypeIcon()}
            </div>
            
            {event.reminder && (
              <div className="rounded-full p-1 bg-accent">
                <BellIcon className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Context Menu */}
      {showContextMenu && (
        <ContextMenu
          x={contextMenuPosition.x}
          y={contextMenuPosition.y}
          onEdit={() => onEdit(event)}
          onDuplicate={() => onDuplicate(event)}
          onDelete={() => onDelete(event.id)}
          onClose={() => setShowContextMenu(false)}
        />
      )}
      
      {/* Event Details Modal */}
      <EventDetails
        event={event}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        onEdit={onEdit}
        onDelete={onDelete}
        dealName={dealName}
        assignedToName={assignedToName}
      />
    </>
  );
}
