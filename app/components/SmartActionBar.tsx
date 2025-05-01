'use client';

import { useState, useRef, useEffect } from 'react';

interface Action {
  id: string;
  name: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface SmartActionBarProps {
  actions: Action[];
}

export default function SmartActionBar({ actions }: SmartActionBarProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (containerRef.current) {
      setMaxScroll(containerRef.current.scrollWidth - containerRef.current.clientWidth);
    }
  }, [actions]);
  
  const handleScroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 200;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : Math.min(maxScroll, scrollPosition + scrollAmount);
      
      containerRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth',
      });
      
      setScrollPosition(newPosition);
    }
  };
  
  return (
    <div className="dark-card mb-4 relative">
      <div className="p-4 flex items-center">
        <h3 className="text-lg font-medium text-white mr-4">Quick Actions</h3>
        
        {maxScroll > 0 && (
          <button
            onClick={() => handleScroll('left')}
            className={`p-1 rounded-full bg-dark-card-hover mr-2 ${
              scrollPosition <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dark-card-hover/80'
            }`}
            disabled={scrollPosition <= 0}
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        
        <div 
          ref={containerRef}
          className="flex-1 overflow-x-auto hide-scrollbar flex items-center space-x-2"
        >
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="flex items-center px-4 py-2 bg-dark-card-hover hover:bg-dark-card-hover/80 rounded-md transition-all duration-200 whitespace-nowrap"
            >
              <span className="mr-2">{action.icon}</span>
              <span className="text-sm text-white">{action.name}</span>
            </button>
          ))}
        </div>
        
        {maxScroll > 0 && (
          <button
            onClick={() => handleScroll('right')}
            className={`p-1 rounded-full bg-dark-card-hover ml-2 ${
              scrollPosition >= maxScroll ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dark-card-hover/80'
            }`}
            disabled={scrollPosition >= maxScroll}
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
