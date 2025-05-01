'use client';

import { useState } from 'react';

interface Stage {
  id: string;
  name: string;
  completed: boolean;
  date?: string;
}

interface DealProgressTrackerProps {
  dealId: string;
  currentDay: number;
  totalDays: number;
  stages: Stage[];
  onUpdateProgress: (progress: number) => void;
  onDealOutcome: (outcome: 'win' | 'lost') => void;
}

export default function DealProgressTracker({
  dealId,
  currentDay,
  totalDays,
  stages,
  onUpdateProgress,
  onDealOutcome,
}: DealProgressTrackerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const progress = (currentDay / totalDays) * 100;
  
  const handleProgressUpdate = (newProgress: number) => {
    setIsUpdating(true);
    
    // Simulate API call
    setTimeout(() => {
      onUpdateProgress(newProgress);
      setIsUpdating(false);
    }, 500);
  };
  
  const handleOutcome = (outcome: 'win' | 'lost') => {
    // Confirm before proceeding
    if (window.confirm(`Are you sure you want to mark this deal as ${outcome}?`)) {
      onDealOutcome(outcome);
    }
  };
  
  return (
    <div className="dark-card overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Deal Progress</h3>
          <div className="text-sm text-text-secondary">
            <span className="text-accent font-medium">{currentDay} days</span> of {totalDays} days
          </div>
        </div>
        
        <div className="relative mb-6">
          <div className="h-2 bg-dark-card-hover rounded-full">
            <div 
              className="h-2 bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between mt-2">
            <span className="text-xs text-text-secondary">Start</span>
            <span className="text-xs text-text-secondary">End</span>
          </div>
          
          <div className="absolute top-0 left-0 w-full flex justify-between px-1">
            {stages.map((stage, index) => {
              const position = (index / (stages.length - 1)) * 100;
              return (
                <div 
                  key={stage.id}
                  className="relative"
                  style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                >
                  <div 
                    className={`w-4 h-4 rounded-full ${
                      stage.completed 
                        ? 'bg-accent shadow-accent-glow' 
                        : 'bg-dark-card-hover border border-text-secondary'
                    } transition-all duration-300 cursor-pointer`}
                    onClick={() => handleProgressUpdate(position)}
                  ></div>
                  <div className="absolute top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <span className="text-xs font-medium text-white">{stage.name}</span>
                    {stage.date && (
                      <span className="block text-xs text-text-secondary">{stage.date}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="flex justify-between mt-12">
          <button
            onClick={() => handleOutcome('win')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-all duration-200 flex-1 mr-2"
            disabled={isUpdating}
          >
            ✅ Win
          </button>
          <button
            onClick={() => handleOutcome('lost')}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-all duration-200 flex-1 ml-2"
            disabled={isUpdating}
          >
            ❌ Lost
          </button>
        </div>
      </div>
    </div>
  );
}
