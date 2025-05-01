'use client';

import { useState } from 'react';
import { CommunicationRecord, Tenant } from '@/lib/mock-leases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, MessageSquare, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface CommunicationHistoryProps {
  tenant: Tenant;
  onAddCommunication?: (record: CommunicationRecord) => void;
}

export function CommunicationHistory({ tenant, onAddCommunication }: CommunicationHistoryProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [type, setType] = useState<'Email' | 'Phone' | 'Meeting' | 'Letter' | 'Other'>('Meeting');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [outcome, setOutcome] = useState('');
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined);
  
  const handleSubmit = () => {
    if (!date || !subject || !description) return;
    
    const newRecord: CommunicationRecord = {
      id: `comm-${Date.now()}`,
      date: date.toISOString(),
      type,
      subject,
      description,
      outcome: outcome || undefined,
      followUpDate: followUpDate?.toISOString(),
      contactPerson: tenant.contactName,
      recordedBy: 'Current User', // In a real app, this would be the current user
    };
    
    if (onAddCommunication) {
      onAddCommunication(newRecord);
    }
    
    // Reset form
    setDate(new Date());
    setType('Meeting');
    setSubject('');
    setDescription('');
    setOutcome('');
    setFollowUpDate(undefined);
    setIsDialogOpen(false);
  };
  
  return (
    <Card className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-black dark:text-white">Communication History</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm"
              className="bg-[#00F0B4] hover:bg-[#00D0A0] text-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Communication
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
            <DialogHeader>
              <DialogTitle className="text-black dark:text-white">Add Communication Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="type" className="text-gray-700 dark:text-gray-300">Type</Label>
                  <Select value={type} onValueChange={(value) => setType(value as any)}>
                    <SelectTrigger id="type" className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Phone">Phone</SelectItem>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-gray-700 dark:text-gray-300">Subject</Label>
                <Input 
                  id="subject" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">Description</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="outcome" className="text-gray-700 dark:text-gray-300">Outcome</Label>
                <Textarea 
                  id="outcome" 
                  value={outcome} 
                  onChange={(e) => setOutcome(e.target.value)} 
                  className="bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="followUpDate" className="text-gray-700 dark:text-gray-300">Follow-up Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="followUpDate"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white dark:bg-[#22272E] border-gray-200 dark:border-[#2F374A] text-gray-700 dark:text-gray-300",
                        !followUpDate && "text-gray-500 dark:text-gray-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {followUpDate ? format(followUpDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white dark:bg-[#1A1D23] border-gray-200 dark:border-[#2F374A]">
                    <Calendar
                      mode="single"
                      selected={followUpDate}
                      onSelect={setFollowUpDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                disabled={!date || !subject || !description}
              >
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {tenant.communicationHistory && tenant.communicationHistory.length > 0 ? (
          <div className="space-y-4">
            {tenant.communicationHistory.map((record) => (
              <div key={record.id} className="border-b border-gray-200 dark:border-[#2F374A] pb-4 last:border-0 last:pb-0">
                <div className="flex items-start">
                  <MessageSquare className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-black dark:text-white">{record.subject}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {record.type} • {format(new Date(record.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      {record.followUpDate && (
                        <div className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          Follow-up: {format(new Date(record.followUpDate), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-gray-700 dark:text-gray-300">{record.description}</p>
                    {record.outcome && (
                      <div className="mt-2 pl-3 border-l-2 border-gray-200 dark:border-[#2F374A]">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Outcome:</span> {record.outcome}
                        </p>
                      </div>
                    )}
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Recorded by {record.recordedBy}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No communication records yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Add your first communication record to keep track of interactions with this tenant.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
