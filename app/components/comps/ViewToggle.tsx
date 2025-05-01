'use client';

import { Button } from '../ui/button';

interface ViewToggleProps {
  currentView: 'map' | 'table';
  onViewToggle: (view: 'map' | 'table') => void;
}

export function ViewToggle({ currentView, onViewToggle }: ViewToggleProps) {
  return (
    <div className="flex items-center space-x-2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-md p-1 shadow-sm">
      <Button
        variant={currentView === 'map' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewToggle('map')}
        className={currentView === 'map'
          ? 'bg-accent hover:bg-accent/90 text-white shadow-sm'
          : 'text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
        }
      >
        Map
      </Button>
      <Button
        variant={currentView === 'table' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewToggle('table')}
        className={currentView === 'table'
          ? 'bg-accent hover:bg-accent/90 text-white shadow-sm'
          : 'text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
        }
      >
        Table
      </Button>
    </div>
  );
}
