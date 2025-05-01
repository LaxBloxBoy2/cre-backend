'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useDeals, CalendarEvent, CalendarEventCreate, CalendarEventUpdate } from '../hooks/useCalendarEvents';
import { format, parseISO } from 'date-fns';
import {
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
  CheckCircledIcon,
  BellIcon,
  PersonIcon,
  MagnifyingGlassIcon,
  TimerIcon,
  FileTextIcon
} from '@radix-ui/react-icons';
import BuildingIcon from './icons/BuildingIcon';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: CalendarEventCreate | CalendarEventUpdate) => void;
  onDelete?: () => void;
  event?: CalendarEvent;
  defaultDate?: Date;
  mode: 'create' | 'edit';
  dealId?: string; // Optional deal ID for pre-selecting a deal
}

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  defaultDate,
  mode,
  dealId: initialDealId
}: EventModalProps) {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [dealId, setDealId] = useState<string>("none");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [eventType, setEventType] = useState<'custom' | 'lifecycle' | 'deadline'>('custom');
  const [allDay, setAllDay] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reminder options
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState<'1h' | '1d' | '3d' | '1w'>('1d');

  // Team member assignment
  const [assignedTo, setAssignedTo] = useState<string>("none");

  // Fetch deals for dropdown
  const { data: deals, isLoading: dealsLoading } = useDeals();

  // Mock team members data (in a real app, this would be fetched from an API)
  const teamMembers = [
    { id: 'user1', name: 'John Doe' },
    { id: 'user2', name: 'Jane Smith' },
    { id: 'user3', name: 'Bob Johnson' },
    { id: 'user4', name: 'Alice Williams' }
  ];

  // Initialize form with event data when editing
  useEffect(() => {
    if (mode === 'edit' && event) {
      setTitle(event.title);
      setDescription(event.description || '');

      const start = parseISO(event.start);
      const end = parseISO(event.end);

      setStartDate(format(start, 'yyyy-MM-dd'));
      setStartTime(format(start, 'HH:mm'));
      setEndDate(format(end, 'yyyy-MM-dd'));
      setEndTime(format(end, 'HH:mm'));

      setDealId(event.deal_id || "none");
      setPriority(event.priority);
      setEventType(event.event_type || 'custom');
      setAllDay(event.all_day || false);

      // Set reminder if available
      if (event.reminder) {
        setEnableReminder(true);
        setReminderTime(event.reminder as any);
      }

      // Set assigned team member if available
      if (event.assigned_to) {
        setAssignedTo(event.assigned_to);
      }
    } else if (mode === 'create') {
      // Set default date if provided
      if (defaultDate) {
        setStartDate(format(defaultDate, 'yyyy-MM-dd'));
        setEndDate(format(defaultDate, 'yyyy-MM-dd'));
      }

      // Set initial deal ID if provided
      if (initialDealId) {
        setDealId(initialDealId);
      }
    }
  }, [mode, event, defaultDate, initialDealId]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (!allDay && !startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!allDay && !endTime) {
      newErrors.endTime = 'End time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return;

    const start = allDay
      ? `${startDate}T00:00:00.000Z`
      : `${startDate}T${startTime}:00.000Z`;

    const end = allDay
      ? `${endDate}T23:59:59.999Z`
      : `${endDate}T${endTime}:00.000Z`;

    const eventData: CalendarEventCreate | CalendarEventUpdate = {
      title,
      description: description || undefined,
      start,
      end,
      deal_id: dealId === "none" ? undefined : dealId,
      priority,
      event_type: eventType,
      all_day: allDay,
      // Add new fields
      reminder: enableReminder ? reminderTime : undefined,
      assigned_to: assignedTo === "none" ? undefined : assignedTo
    };

    onSave(eventData);
    onClose();
  };

  // Helper function to get icon for event type
  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'custom':
        return <CalendarIcon className="h-4 w-4 mr-2" />;
      case 'lifecycle':
        return <TimerIcon className="h-4 w-4 mr-2" />;
      case 'deadline':
        return <ExclamationTriangleIcon className="h-4 w-4 mr-2" />;
      default:
        return <CalendarIcon className="h-4 w-4 mr-2" />;
    }
  };

  // Helper function to get color for priority
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-6" style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-dark)',
        color: 'var(--text-primary)'
      }}>
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            {getEventTypeIcon(eventType)}
            <span>{mode === 'create' ? 'Create New Event' : 'Edit Event'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Basic Information</h3>

            <div className="space-y-2 mb-4">
              <Label htmlFor="title" className="flex items-center mb-2">
                <FileTextIcon className="h-4 w-4 mr-2" />
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  borderColor: 'var(--border-dark)',
                  color: 'var(--text-primary)'
                }}
                placeholder="Event title"
                className="p-2"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            <div className="space-y-2 mb-4">
              <Label htmlFor="description" className="flex items-center mb-2">
                <InfoCircledIcon className="h-4 w-4 mr-2" />
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  borderColor: 'var(--border-dark)',
                  color: 'var(--text-primary)'
                }}
                placeholder="Event description"
                rows={3}
                className="p-2"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Date & Time</h3>

            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="all-day"
                checked={allDay}
                onCheckedChange={(checked) => setAllDay(checked as boolean)}
              />
              <Label htmlFor="all-day" className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-2" />
                All day event
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-card-hover)',
                    borderColor: 'var(--border-dark)',
                    color: 'var(--text-primary)'
                  }}
                />
                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
              </div>

              {!allDay && (
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg-card-hover)',
                      borderColor: 'var(--border-dark)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-card-hover)',
                    borderColor: 'var(--border-dark)',
                    color: 'var(--text-primary)'
                  }}
                />
                {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
              </div>

              {!allDay && (
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg-card-hover)',
                      borderColor: 'var(--border-dark)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Deal & Assignment */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Deal & Assignment</h3>

            <div className="space-y-2">
              <Label htmlFor="deal" className="flex items-center">
                <BuildingIcon className="h-4 w-4 mr-2" />
                Related Deal
              </Label>
              <Select value={dealId} onValueChange={setDealId}>
                <SelectTrigger style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  borderColor: 'var(--border-dark)',
                  color: 'var(--text-primary)'
                }}>
                  <SelectValue placeholder="Select a deal (optional)" />
                </SelectTrigger>
                <SelectContent style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-dark)',
                  color: 'var(--text-primary)'
                }}>
                  <SelectItem value="none">None</SelectItem>
                  {dealsLoading ? (
                    <SelectItem value="loading" disabled>Loading deals...</SelectItem>
                  ) : (
                    deals?.map((deal: any) => (
                      <SelectItem key={deal.id} value={deal.id}>
                        {deal.project_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned-to" className="flex items-center">
                <PersonIcon className="h-4 w-4 mr-2" />
                Assigned To
              </Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  borderColor: 'var(--border-dark)',
                  color: 'var(--text-primary)'
                }}>
                  <SelectValue placeholder="Assign to team member (optional)" />
                </SelectTrigger>
                <SelectContent style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-dark)',
                  color: 'var(--text-primary)'
                }}>
                  <SelectItem value="none">None</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Event Details</h3>

            <div className="space-y-2">
              <Label htmlFor="event-type" className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Event Type
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={eventType === 'custom' ? 'default' : 'outline'}
                  className={`flex items-center justify-center ${eventType === 'custom' ? 'bg-accent text-white' : ''}`}
                  onClick={() => setEventType('custom')}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Custom
                </Button>
                <Button
                  type="button"
                  variant={eventType === 'lifecycle' ? 'default' : 'outline'}
                  className={`flex items-center justify-center ${eventType === 'lifecycle' ? 'bg-green-600 text-white' : ''}`}
                  onClick={() => setEventType('lifecycle')}
                >
                  <TimerIcon className="h-4 w-4 mr-2" />
                  Lifecycle
                </Button>
                <Button
                  type="button"
                  variant={eventType === 'deadline' ? 'default' : 'outline'}
                  className={`flex items-center justify-center ${eventType === 'deadline' ? 'bg-red-600 text-white' : ''}`}
                  onClick={() => setEventType('deadline')}
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  Deadline
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                Priority
              </Label>
              <RadioGroup value={priority} onValueChange={(value: any) => setPriority(value)} className="flex space-x-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="priority-low" />
                  <Label htmlFor="priority-low" className="flex items-center text-blue-500">
                    <CheckCircledIcon className="h-4 w-4 mr-1 text-blue-500" />
                    Low
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="priority-medium" />
                  <Label htmlFor="priority-medium" className="flex items-center text-yellow-500">
                    <CheckCircledIcon className="h-4 w-4 mr-1 text-yellow-500" />
                    Medium
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="priority-high" />
                  <Label htmlFor="priority-high" className="flex items-center text-red-500">
                    <CheckCircledIcon className="h-4 w-4 mr-1 text-red-500" />
                    High
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Reminder */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Reminder</h3>

            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="enable-reminder"
                checked={enableReminder}
                onCheckedChange={(checked) => setEnableReminder(checked as boolean)}
              />
              <Label htmlFor="enable-reminder" className="flex items-center">
                <BellIcon className="h-4 w-4 mr-2" />
                Remind me before event
              </Label>
            </div>

            {enableReminder && (
              <div className="grid grid-cols-4 gap-2">
                <Button
                  type="button"
                  variant={reminderTime === '1h' ? 'default' : 'outline'}
                  className={reminderTime === '1h' ? 'bg-accent text-white' : ''}
                  onClick={() => setReminderTime('1h')}
                >
                  1 hour
                </Button>
                <Button
                  type="button"
                  variant={reminderTime === '1d' ? 'default' : 'outline'}
                  className={reminderTime === '1d' ? 'bg-accent text-white' : ''}
                  onClick={() => setReminderTime('1d')}
                >
                  1 day
                </Button>
                <Button
                  type="button"
                  variant={reminderTime === '3d' ? 'default' : 'outline'}
                  className={reminderTime === '3d' ? 'bg-accent text-white' : ''}
                  onClick={() => setReminderTime('3d')}
                >
                  3 days
                </Button>
                <Button
                  type="button"
                  variant={reminderTime === '1w' ? 'default' : 'outline'}
                  className={reminderTime === '1w' ? 'bg-accent text-white' : ''}
                  onClick={() => setReminderTime('1w')}
                >
                  1 week
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {mode === 'edit' && onDelete && (
            <Button
              variant="destructive"
              onClick={onDelete}
              className="mr-auto"
            >
              Delete
            </Button>
          )}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to hover:shadow-accent-glow"
              style={{ color: 'var(--button-text)' }}
            >
              {mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
