'use client';

import { useState } from 'react';
import { SatisfactionRecord, Tenant } from '@/lib/mock-leases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Plus, Star, StarOff } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface SatisfactionTrackingProps {
  tenant: Tenant;
  onAddSatisfaction?: (record: SatisfactionRecord) => void;
}

export function SatisfactionTracking({ tenant, onAddSatisfaction }: SatisfactionTrackingProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [rating, setRating] = useState(3);
  const [feedback, setFeedback] = useState('');
  
  const handleSubmit = () => {
    if (!date) return;
    
    const newRecord: SatisfactionRecord = {
      id: `sat-${Date.now()}`,
      date: date.toISOString(),
      rating,
      feedback: feedback || undefined,
      recordedBy: 'Current User', // In a real app, this would be the current user
    };
    
    if (onAddSatisfaction) {
      onAddSatisfaction(newRecord);
    }
    
    // Reset form
    setDate(new Date());
    setRating(3);
    setFeedback('');
    setIsDialogOpen(false);
  };
  
  const getAverageRating = () => {
    if (!tenant.satisfactionHistory || tenant.satisfactionHistory.length === 0) {
      return tenant.satisfactionRating || 0;
    }
    
    const sum = tenant.satisfactionHistory.reduce((acc, record) => acc + record.rating, 0);
    return sum / tenant.satisfactionHistory.length;
  };
  
  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-500 dark:text-green-400';
    if (rating >= 3) return 'text-blue-500 dark:text-blue-400';
    if (rating >= 2) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };
  
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => isDialogOpen && setRating(star)}
            className={cn(
              "h-6 w-6",
              star <= rating ? getRatingColor(rating) : "text-gray-300 dark:text-gray-600"
            )}
          >
            <Star className="h-full w-full fill-current" />
          </button>
        ))}
      </div>
    );
  };
  
  return (
    <Card className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-black dark:text-white">Satisfaction Tracking</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm"
              className="bg-[#00F0B4] hover:bg-[#00D0A0] text-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Rating
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
            <DialogHeader>
              <DialogTitle className="text-black dark:text-white">Add Satisfaction Rating</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-gray-700 dark:text-gray-300">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300",
                        !date && "text-gray-500 dark:text-gray-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Rating</Label>
                <div className="flex items-center space-x-1">
                  {renderStars(rating)}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="feedback" className="text-gray-700 dark:text-gray-300">Feedback</Label>
                <Textarea 
                  id="feedback" 
                  value={feedback} 
                  onChange={(e) => setFeedback(e.target.value)} 
                  className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
                  placeholder="Enter tenant feedback (optional)"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-gray-700 dark:text-gray-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                className="bg-[#00F0B4] hover:bg-[#00D0A0] text-black"
                disabled={!date}
              >
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-700 dark:text-gray-300">Current Satisfaction</p>
            <div className="flex items-center">
              <p className={`text-xl font-bold mr-2 ${getRatingColor(getAverageRating())}`}>
                {getAverageRating().toFixed(1)}
              </p>
              <div className="flex">
                {renderStars(Math.round(getAverageRating()))}
              </div>
            </div>
          </div>
        </div>
        
        {tenant.satisfactionHistory && tenant.satisfactionHistory.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Rating History</h3>
            {tenant.satisfactionHistory.map((record) => (
              <div key={record.id} className="border-b border-gray-200 dark:border-[#2F374A] pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <p className={`font-medium mr-2 ${getRatingColor(record.rating)}`}>{record.rating}/5</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(record.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    {record.feedback && (
                      <p className="mt-1 text-gray-700 dark:text-gray-300">"{record.feedback}"</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Recorded by {record.recordedBy}
                    </p>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={cn(
                          "h-4 w-4",
                          star <= record.rating ? getRatingColor(record.rating) : "text-gray-300 dark:text-gray-600"
                        )}
                      >
                        <Star className="h-full w-full fill-current" />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <StarOff className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No satisfaction ratings yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Add your first satisfaction rating to track tenant satisfaction over time.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
