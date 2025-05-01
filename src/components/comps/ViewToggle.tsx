'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Map, Table } from 'lucide-react';

interface ViewToggleProps {
  currentView: 'map' | 'table';
  onViewToggle: (view: 'map' | 'table') => void;
}

export function ViewToggle({ currentView, onViewToggle }: ViewToggleProps) {
  const { theme } = useTheme();
  
  return (
    <div className="flex items-center space-x-2 bg-background border rounded-lg p-1">
      <Button
        variant={currentView === 'map' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewToggle('map')}
        className={currentView === 'map' ? 'bg-accent text-white hover:bg-accent/90' : ''}
      >
        <Map className="h-4 w-4 mr-2" />
        Map
      </Button>
      <Button
        variant={currentView === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewToggle('table')}
        className={currentView === 'table' ? 'bg-accent text-white hover:bg-accent/90' : ''}
      >
        <Table className="h-4 w-4 mr-2" />
        Table
      </Button>
    </div>
  );
}
