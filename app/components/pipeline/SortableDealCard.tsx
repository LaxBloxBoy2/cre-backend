'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DealCard } from './DealCard';
import { Deal } from '../../types/deal';
import { usePermissions } from '../../hooks/usePermissions';

interface SortableDealCardProps {
  deal: Deal;
  stage: string;
}

export function SortableDealCard({ deal, stage }: SortableDealCardProps) {
  const { canMoveDealsPipeline } = usePermissions();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    active
  } = useSortable({
    id: deal.id,
    data: {
      deal,
      stage,
      type: 'deal'
    },
    disabled: !canMoveDealsPipeline
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 0,
    position: isDragging ? 'relative' : 'static',
    pointerEvents: isDragging ? 'none' : 'auto',
    touchAction: canMoveDealsPipeline ? 'none' : 'auto', // Improves touch device dragging
    cursor: canMoveDealsPipeline ? 'grab' : 'pointer',
    userSelect: 'none' // Prevent text selection during drag
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={canMoveDealsPipeline ? "touch-none" : ""}
      {...attributes}
      {...listeners}
      data-draggable={canMoveDealsPipeline ? "true" : "false"}
    >
      <DealCard
        deal={deal}
        isDraggable={canMoveDealsPipeline}
      />
    </div>
  );
}
