'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  Pencil1Icon, 
  TrashIcon, 
  CopyIcon, 
  Cross2Icon 
} from '@radix-ui/react-icons';

interface ContextMenuProps {
  x: number;
  y: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function ContextMenu({
  x,
  y,
  onEdit,
  onDuplicate,
  onDelete,
  onClose
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });

  // Adjust position if menu would go off screen
  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      let adjustedX = x;
      let adjustedY = y;
      
      if (x + menuRect.width > windowWidth) {
        adjustedX = windowWidth - menuRect.width - 10;
      }
      
      if (y + menuRect.height > windowHeight) {
        adjustedY = windowHeight - menuRect.height - 10;
      }
      
      setPosition({ x: adjustedX, y: adjustedY });
    }
  }, [x, y]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute z-50 rounded-md shadow-md"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-dark)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-dark)'
      }}
    >
      <div className="flex justify-between items-center p-2 border-b" style={{ borderColor: 'var(--border-dark)' }}>
        <span className="text-sm font-medium">Event Actions</span>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-opacity-10"
          style={{ backgroundColor: 'var(--bg-card-hover)' }}
        >
          <Cross2Icon className="h-4 w-4" />
        </button>
      </div>
      <div className="p-1">
        <button
          className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-opacity-80"
          style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
          onClick={() => {
            onEdit();
            onClose();
          }}
        >
          <Pencil1Icon className="h-4 w-4 mr-2" />
          Edit
        </button>
        <button
          className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-opacity-80"
          style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
          onClick={() => {
            onDuplicate();
            onClose();
          }}
        >
          <CopyIcon className="h-4 w-4 mr-2" />
          Duplicate
        </button>
        <button
          className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-opacity-80 text-red-500"
          style={{ backgroundColor: 'var(--bg-card)' }}
          onClick={() => {
            onDelete();
            onClose();
          }}
        >
          <TrashIcon className="h-4 w-4 mr-2" />
          Delete
        </button>
      </div>
    </div>
  );
}
