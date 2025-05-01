'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableDealCard } from './SortableDealCard';
import { Deal } from '../../types/deal';

interface PipelineColumnProps {
  stage: string;
  deals: Deal[];
}

export function PipelineColumn({ stage, deals }: PipelineColumnProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: `droppable-${stage}`,
    data: {
      stage,
      type: 'column'
    }
  });

  // Get stage display name and color
  const stageDisplayName = getStageDisplayName(stage);
  const stageColor = getStageColor(stage);

  return (
    <div
      className="flex-shrink-0 w-80"
      ref={setNodeRef}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{stageDisplayName}</h3>
          <span
            className="ml-2 text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: stageColor.bg,
              color: stageColor.text,
              boxShadow: stageColor.shadow
            }}
          >
            {deals.length}
          </span>
        </div>
      </div>

      <div
        className="space-y-3 min-h-[200px] p-2 rounded-lg transition-all duration-200"
        style={{
          backgroundColor: 'var(--pipeline-column-bg)',
          borderColor: 'var(--border-dark)',
          boxShadow: isOver ? '0 0 0 2px var(--accent)' : 'none',
          border: isOver ? '2px dashed var(--accent)' : '2px solid var(--border-dark)',
          position: 'relative',
          minWidth: '320px'
        }}
      >
        <SortableContext
          items={deals.map(deal => deal.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.map((deal) => (
            <SortableDealCard
              key={deal.id}
              deal={deal}
              stage={stage}
            />
          ))}
        </SortableContext>

        {deals.length === 0 && (
          <div
            className="h-24 flex items-center justify-center rounded-lg border-2 border-dashed"
            style={{
              borderColor: 'var(--border-dark)',
              color: 'var(--text-muted)'
            }}
          >
            <p className="text-sm">Drop deals here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getStageDisplayName(stage: string): string {
  switch (stage) {
    case 'Lead':
      return 'Lead';
    case 'Analyzing':
      return 'Analyzing';
    case 'LOI':
      return 'LOI';
    case 'Under DD':
      return 'Under DD';
    case 'Negotiating':
      return 'Negotiating';
    case 'Closed':
      return 'Closed';
    case 'Archived':
      return 'Archived';
    default:
      return stage;
  }
}

function getStageColor(stage: string): { bg: string, text: string, shadow: string } {
  switch (stage) {
    case 'Lead':
      return {
        bg: 'rgba(59, 130, 246, 0.2)',
        text: '#3B82F6',
        shadow: '0 0 8px rgba(59, 130, 246, 0.3)'
      };
    case 'Analyzing':
      return {
        bg: 'rgba(139, 92, 246, 0.2)',
        text: '#8B5CF6',
        shadow: '0 0 8px rgba(139, 92, 246, 0.3)'
      };
    case 'LOI':
      return {
        bg: 'rgba(245, 158, 11, 0.2)',
        text: '#F59E0B',
        shadow: '0 0 8px rgba(245, 158, 11, 0.3)'
      };
    case 'Under DD':
      return {
        bg: 'rgba(236, 72, 153, 0.2)',
        text: '#EC4899',
        shadow: '0 0 8px rgba(236, 72, 153, 0.3)'
      };
    case 'Negotiating':
      return {
        bg: 'rgba(16, 185, 129, 0.2)',
        text: '#10B981',
        shadow: '0 0 8px rgba(16, 185, 129, 0.3)'
      };
    case 'Closed':
      return {
        bg: 'rgba(54, 255, 176, 0.2)',
        text: '#36FFB0',
        shadow: '0 0 8px rgba(54, 255, 176, 0.3)'
      };
    case 'Archived':
      return {
        bg: 'rgba(107, 114, 128, 0.2)',
        text: '#6B7280',
        shadow: '0 0 8px rgba(107, 114, 128, 0.3)'
      };
    default:
      return {
        bg: 'rgba(107, 114, 128, 0.2)',
        text: '#6B7280',
        shadow: '0 0 8px rgba(107, 114, 128, 0.3)'
      };
  }
}
