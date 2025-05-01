'use client';

import { format, differenceInMonths } from 'date-fns';
import { Lease } from '@/app/lib/mock-leases';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { CalendarIcon, Clock, AlertCircle } from 'lucide-react';

interface LeaseTimelineProps {
  lease: Lease;
}

export function LeaseTimeline({ lease }: LeaseTimelineProps) {
  const startDate = new Date(lease.startDate);
  const endDate = new Date(lease.endDate);
  const today = new Date();

  // Calculate total lease duration in months
  const totalDuration = differenceInMonths(endDate, startDate);

  // Calculate elapsed time in months
  const elapsedTime = differenceInMonths(today, startDate);

  // Calculate percentage of lease completed
  const percentComplete = Math.min(Math.max(Math.round((elapsedTime / totalDuration) * 100), 0), 100);

  // Calculate months remaining
  const monthsRemaining = differenceInMonths(endDate, today);

  // Determine lease status
  const getStatusInfo = () => {
    if (today < startDate) {
      return {
        status: 'Upcoming',
        color: 'bg-blue-500 dark:bg-blue-600',
        textColor: 'text-blue-600 dark:text-blue-400',
        message: `Lease starts in ${differenceInMonths(startDate, today)} months`
      };
    } else if (today > endDate) {
      return {
        status: 'Expired',
        color: 'bg-red-500 dark:bg-red-600',
        textColor: 'text-red-600 dark:text-red-400',
        message: `Lease expired ${differenceInMonths(today, endDate)} months ago`
      };
    } else if (monthsRemaining <= 6) {
      return {
        status: 'Ending Soon',
        color: 'bg-amber-500 dark:bg-amber-600',
        textColor: 'text-amber-600 dark:text-amber-400',
        message: `${monthsRemaining} months remaining`
      };
    } else {
      return {
        status: 'Active',
        color: 'bg-green-500 dark:bg-green-600',
        textColor: 'text-green-600 dark:text-green-400',
        message: `${monthsRemaining} months remaining`
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Lease Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {format(startDate, 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground">
              {format(endDate, 'MMM d, yyyy')}
            </span>
            <CalendarIcon className="h-4 w-4 ml-2 text-muted-foreground" />
          </div>
        </div>

        <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden dark:bg-gray-700">
          <div
            className={`absolute top-0 left-0 h-full ${statusInfo.color} dark:opacity-90`}
            style={{ width: `${percentComplete}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span>Start</span>
          <span>{percentComplete}% Complete</span>
          <span>End</span>
        </div>

        <div className="flex items-center mt-4">
          <Badge variant={
            statusInfo.status === 'Active' ? 'default' :
            statusInfo.status === 'Upcoming' ? 'secondary' :
            statusInfo.status === 'Ending Soon' ? 'outline' : 'destructive'
          }>
            {statusInfo.status}
          </Badge>
          <div className={`flex items-center ml-3 text-sm ${statusInfo.textColor}`}>
            <AlertCircle className="h-4 w-4 mr-1" />
            {statusInfo.message}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
