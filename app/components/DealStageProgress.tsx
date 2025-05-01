'use client';

import { useState } from 'react';
import { useDealStages, useUpdateDealStage } from '../hooks/dashboard';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { CheckIcon, ClockIcon } from '@radix-ui/react-icons';

interface DealStageProgressProps {
  dealId: string;
}

export default function DealStageProgress({ dealId }: DealStageProgressProps) {
  const { data: stages, isLoading, error } = useDealStages(dealId);
  const updateStage = useUpdateDealStage();
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="dark-card p-6">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="space-y-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="relative">
              <div className="flex items-center">
                <Skeleton className="h-8 w-8 rounded-full mr-4" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              {i < 4 && <div className="absolute left-4 top-8 w-0.5 h-12 bg-dark-card-hover"></div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error loading deal stages:', error);
    // Continue with fallback data
  }

  // Add additional error handling for stages data
  if (stages && !Array.isArray(stages)) {
    console.error('Stages data is not an array:', stages);
    // Continue with fallback data
  }

  // Fallback data if API fails
  const fallbackData = [
    {
      id: '1',
      name: 'Initial Contact',
      completed: true,
      completed_at: '2023-11-15T00:00:00Z',
      order: 1,
      target_days: 7
    },
    {
      id: '2',
      name: 'Due Diligence',
      completed: true,
      completed_at: '2023-11-25T00:00:00Z',
      order: 2,
      target_days: 14
    },
    {
      id: '3',
      name: 'Negotiation',
      completed: false,
      completed_at: null,
      order: 3,
      target_days: 10
    },
    {
      id: '4',
      name: 'Final Approval',
      completed: false,
      completed_at: null,
      order: 4,
      target_days: 7
    },
    {
      id: '5',
      name: 'Closing',
      completed: false,
      completed_at: null,
      order: 5,
      target_days: 5
    }
  ];

  // Use real data if available, otherwise fallback
  const stagesData = stages || fallbackData;

  // Sort stages by order - ensure stagesData is an array before spreading
  const sortedStages = Array.isArray(stagesData)
    ? [...stagesData].sort((a, b) => a.order - b.order)
    : fallbackData.sort((a, b) => a.order - b.order);

  // Find the current active stage (first incomplete stage)
  const currentStageIndex = sortedStages.findIndex(stage => !stage.completed);

  const handleToggleStage = (stageId: string, completed: boolean) => {
    console.log('Toggling stage completion:', { stageId, completed, newValue: !completed });

    // Add a class to the button to show it's loading
    const button = document.querySelector(`[data-stage-id="${stageId}"]`);
    if (button) {
      button.classList.add('opacity-50', 'pointer-events-none');
    }

    // Call the mutation
    updateStage.mutate(
      {
        dealId,
        stageId,
        data: { completed: !completed }
      },
      {
        onSuccess: (data) => {
          console.log('Stage update successful:', data);

          // Force a refresh of the stages data
          setTimeout(() => {
            window.location.reload();
          }, 500);
        },
        onError: (error) => {
          console.error('Error updating stage:', error);

          // Remove loading state from button
          if (button) {
            button.classList.remove('opacity-50', 'pointer-events-none');
          }
        }
      }
    );
  };

  const getStageStatus = (index: number, completed: boolean) => {
    if (completed) return 'completed';
    if (index === currentStageIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="dark-card p-6">
      <h2 className="text-lg font-medium text-white mb-6">Deal Progress</h2>

      <div className="space-y-8">
        {sortedStages.map((stage, index) => {
          const status = getStageStatus(index, stage.completed);
          const isLast = index === sortedStages.length - 1;
          const isExpanded = expandedStage === stage.id;

          return (
            <div key={stage.id} className="relative">
              {/* Connector line */}
              {!isLast && (
                <div
                  className={`absolute left-4 top-8 w-0.5 h-12 ${
                    status === 'completed' ? 'bg-accent' : 'bg-dark-card-hover'
                  }`}
                ></div>
              )}

              {/* Stage indicator */}
              <div className="flex items-start">
                <div
                  className={`relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                    status === 'completed'
                      ? 'bg-accent text-dark-bg'
                      : status === 'current'
                      ? 'bg-accent/20 text-accent border border-accent'
                      : 'bg-dark-card-hover text-text-secondary'
                  }`}
                >
                  {status === 'completed' ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <ClockIcon className="h-4 w-4" />
                  )}
                </div>

                <div className="flex-1">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                  >
                    <div>
                      <h3 className={`text-base font-medium ${
                        status === 'completed'
                          ? 'text-white'
                          : status === 'current'
                          ? 'text-accent'
                          : 'text-text-secondary'
                      }`}>
                        {stage.name}
                      </h3>
                      <p className="text-xs text-text-secondary">
                        {stage.completed
                          ? `Completed ${new Date(stage.completed_at).toLocaleDateString()}`
                          : status === 'current'
                          ? 'In Progress'
                          : 'Upcoming'}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <svg
                        className={`h-5 w-5 text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="mt-4 p-4 bg-dark-card-hover/50 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-text-secondary">Target: {stage.target_days} days</span>
                        <Button
                          variant="outline"
                          size="sm"
                          data-stage-id={stage.id}
                          onClick={() => handleToggleStage(stage.id, stage.completed)}
                          className={`text-xs ${
                            stage.completed
                              ? 'border-error text-error hover:bg-error/10'
                              : 'border-accent text-accent hover:bg-accent/10'
                          }`}
                        >
                          {stage.completed ? 'Mark Incomplete' : 'Mark Complete'}
                        </Button>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2">
                        <div className="text-xs text-text-secondary mb-1 flex justify-between">
                          <span>Progress</span>
                          <span>{stage.completed ? '100%' : status === 'current' ? '50%' : '0%'}</span>
                        </div>
                        <div className="h-1.5 w-full bg-dark-card-hover rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to"
                            style={{ width: stage.completed ? '100%' : status === 'current' ? '50%' : '0%' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
