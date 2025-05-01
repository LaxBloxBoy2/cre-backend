'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { LightningBoltIcon } from '@radix-ui/react-icons';
import { useAISuggestions } from '../../hooks/useUnderwriting';
import { formatPercentage } from '../../lib/utils/format';

interface AISuggestionsProps {
  dealId: string;
  propertyType: string;
  location: string;
  onApplySuggestions: (suggestions: Record<string, number>) => void;
}

export default function AISuggestions({
  dealId,
  propertyType,
  location,
  onApplySuggestions
}: AISuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: getSuggestions, isPending, data } = useAISuggestions(dealId);

  const handleGetSuggestions = () => {
    getSuggestions({ propertyType, location });
  };

  const handleApplySuggestions = () => {
    if (data?.suggestions) {
      onApplySuggestions(data.suggestions);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs"
      >
        <LightningBoltIcon className="mr-1 h-3 w-3" />
        AI Suggestions
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-dark-card border-dark-border text-white">
          <DialogHeader>
            <DialogTitle>AI Market Suggestions</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-text-secondary mb-4">
              Get AI-powered suggestions for market metrics based on property type and location.
            </p>

            <div className="bg-dark-card-hover p-4 rounded-lg border border-dark-border mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Property Type</p>
                  <p className="text-white font-medium">{propertyType.charAt(0).toUpperCase() + propertyType.slice(1)}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Location</p>
                  <p className="text-white font-medium">{location}</p>
                </div>
              </div>
            </div>

            {!data && !isPending && (
              <Button
                onClick={handleGetSuggestions}
                className="w-full bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white"
              >
                <LightningBoltIcon className="mr-2 h-4 w-4" />
                Generate Suggestions
              </Button>
            )}

            {isPending && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent mb-4"></div>
                <p className="text-text-secondary">Analyzing market data...</p>
              </div>
            )}

            {data && (
              <div className="space-y-4">
                <div className="bg-dark-card-hover p-4 rounded-lg border border-dark-border">
                  <h4 className="text-md font-medium text-white mb-2">Suggested Values</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(data.suggestions).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-sm text-text-secondary">
                          {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </p>
                        <p className="text-white font-medium">
                          {key.includes('rate') || key.includes('growth')
                            ? formatPercentage(value * 100)
                            : value.toString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-dark-card-hover p-4 rounded-lg border border-dark-border">
                  <h4 className="text-md font-medium text-white mb-2">Explanation</h4>
                  <p className="text-text-secondary text-sm">{data.explanation}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            {data && (
              <Button
                onClick={handleApplySuggestions}
                className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white"
              >
                Apply Suggestions
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
