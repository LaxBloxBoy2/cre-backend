'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { PlusIcon } from '../icons';
import { Deal } from '../../types/deal';
import { useDealPipeline } from '../../hooks/useDealPipeline';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AddDealToPipelineProps {
  onAddDeal: (dealId: string, stage: string) => Promise<void>;
}

export function AddDealToPipeline({ onAddDeal }: AddDealToPipelineProps) {
  const [open, setOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('Lead');
  const [searchTerm, setSearchTerm] = useState('');
  const { allDeals, deals: pipelineDeals } = useDealPipeline();
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Find deals that are not in the pipeline
    const dealsNotInPipeline = allDeals.filter(
      deal => !pipelineDeals.some(pipelineDeal => pipelineDeal.id === deal.id)
    );

    if (searchTerm.trim() === '') {
      setFilteredDeals(dealsNotInPipeline);
    } else {
      const filtered = dealsNotInPipeline.filter(deal =>
        deal.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDeals(filtered);
    }
  }, [searchTerm, allDeals, pipelineDeals]);

  const handleAddDeal = async () => {
    if (!selectedDeal || !selectedStage) return;

    try {
      setIsSubmitting(true);
      await onAddDeal(selectedDeal, selectedStage);
      setOpen(false);
      setSelectedDeal('');
      setSelectedStage('Lead');
      setSearchTerm('');
    } catch (error) {
      console.error('Error adding deal to pipeline:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stages = ['Lead', 'Analyzing', 'LOI', 'Under DD', 'Negotiating', 'Closed', 'Archived'];

  return (
    <Dialog open={open} onOpenChange={(value) => setOpen(value)}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="ml-2"
          style={{
            backgroundColor: 'var(--bg-card-hover)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-dark)'
          }}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Deal to Pipeline
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" style={{ backgroundColor: 'var(--bg-card)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>Add Deal to Pipeline</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="search" style={{ color: 'var(--text-primary)' }}>Search Deals</Label>
            <Input
              id="search"
              placeholder="Search by name or location"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-card-hover)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-dark)'
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal" style={{ color: 'var(--text-primary)' }}>Select Deal</Label>
            <Select value={selectedDeal} onValueChange={setSelectedDeal}>
              <SelectTrigger
                id="deal"
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}
              >
                <SelectValue placeholder="Select a deal" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                {filteredDeals.length > 0 ? (
                  filteredDeals.map((deal) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.project_name} - {deal.location}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center" style={{ color: 'var(--text-muted)' }}>
                    {searchTerm ? 'No matching deals found' : 'No deals available to add'}
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage" style={{ color: 'var(--text-primary)' }}>Pipeline Stage</Label>
            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger
                id="stage"
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-dark)'
                }}
              >
                <SelectValue placeholder="Select a stage" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                {stages.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              style={{
                backgroundColor: 'var(--bg-card-hover)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-dark)'
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddDeal}
              disabled={!selectedDeal || !selectedStage || isSubmitting}
              style={{
                background: 'linear-gradient(to right, var(--accent-gradient-from), var(--accent-gradient-to))',
                color: 'white'
              }}
            >
              {isSubmitting ? 'Adding...' : 'Add to Pipeline'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
