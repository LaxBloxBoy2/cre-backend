'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { PipelineColumn } from '../components/pipeline/PipelineColumn';
import { DealCard } from '../components/pipeline/DealCard';
import { useDealPipeline } from '../hooks/useDealPipeline';
import { usePermissions } from '../hooks/usePermissions';
import { Deal } from '../types/deal';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { FilterIcon, PlusIcon } from '../components/icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { PipelineFilters, PipelineFilterOptions } from '../components/pipeline/PipelineFilters';
import { AddDealToPipeline } from '../components/pipeline/AddDealToPipeline';

export default function PipelinePage() {
  const router = useRouter();
  const { deals, isLoading, error, updateDealStage, applyFilters, clearFilters, refreshDeals } = useDealPipeline();
  const { canMoveDealsPipeline, canCreateDeals } = usePermissions();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDeal, setShowCreateDeal] = useState(false);

  // Function to add a deal to the pipeline
  const handleAddDealToPipeline = async (dealId: string, stage: string) => {
    try {
      await updateDealStage(dealId, stage);
      refreshDeals(); // Refresh the deals after adding
    } catch (error) {
      console.error('Error adding deal to pipeline:', error);
      throw error;
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Reduce activation constraints to make dragging easier
      activationConstraint: {
        distance: 3, // Reduced from 8
        tolerance: 10, // Increased from 5
        delay: 0 // Removed delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group deals by stage
  const stages = ['Lead', 'Analyzing', 'LOI', 'Under DD', 'Negotiating', 'Closed', 'Archived'];
  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage] = deals.filter(deal => deal.deal_stage === stage)
      .sort((a, b) => (a.deal_order || 0) - (b.deal_order || 0));
    return acc;
  }, {} as Record<string, Deal[]>);

  // Find the active deal
  const activeDeal = activeId ? deals.find(deal => deal.id === activeId) : null;

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    console.log('Drag end event:', { active, over });

    if (!over) {
      console.log('No over target, cancelling drag');
      setActiveId(null);
      return;
    }

    // Check if we're dropping on a column
    const isColumn = over.data.current?.type === 'column';
    const targetStage = isColumn
      ? over.data.current?.stage
      : over.data.current?.deal?.deal_stage;

    console.log('Target stage:', targetStage);

    if (!targetStage) {
      console.log('No target stage found');
      setActiveId(null);
      return;
    }

    const sourceStage = active.data.current?.stage;
    console.log('Source stage:', sourceStage);

    // If the item was dropped in a different column/stage
    if (sourceStage !== targetStage) {
      try {
        console.log(`Moving deal ${active.id} from ${sourceStage} to ${targetStage}`);
        // Call API to update the deal stage
        await updateDealStage(active.id, targetStage);
      } catch (error) {
        console.error('Failed to update deal stage:', error);
        // Handle error (could show a toast notification)
      }
    }

    setActiveId(null);
  };

  const handleFilterApply = (filters: PipelineFilterOptions) => {
    applyFilters(filters);
    setShowFilters(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {stages.map((stage, index) => (
            <div key={index} className="flex-shrink-0 w-80">
              <Skeleton className="h-10 w-full mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Error Loading Pipeline</h1>
          <p style={{ color: 'var(--text-muted)' }}>Failed to load deal pipeline. Please try again later.</p>
          <Button
            onClick={() => router.refresh()}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Deal Pipeline</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            style={{
              backgroundColor: 'var(--bg-card-hover)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-dark)'
            }}
          >
            <FilterIcon className="mr-2 h-4 w-4" />
            Filters
          </Button>

          {!isLoading && <AddDealToPipeline onAddDeal={handleAddDealToPipeline} />}

          {canCreateDeals && (
            <Button
              onClick={() => router.push('/deals/new')}
              style={{
                background: 'linear-gradient(to right, var(--accent-gradient-from), var(--accent-gradient-to))',
                color: 'white'
              }}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              New Deal
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="mb-6">
          <PipelineFilters
            onClose={() => setShowFilters(false)}
            onFilter={handleFilterApply}
          />
        </div>
      )}

      {canMoveDealsPipeline ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          <div className="flex space-x-4 overflow-x-auto pb-4 hide-scrollbar">
            {stages.map((stage) => (
              <PipelineColumn
                key={stage}
                stage={stage}
                deals={dealsByStage[stage] || []}
              />
            ))}
          </div>

          <DragOverlay adjustScale={false} dropAnimation={{
            duration: 300,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}>
            {activeId && activeDeal ? (
              <div
                className="opacity-90"
                style={{
                  boxShadow: 'var(--pipeline-drag-overlay-shadow)',
                  pointerEvents: 'none',
                  width: '320px',
                  maxWidth: '320px',
                  transform: 'none'
                }}
              >
                <DealCard deal={activeDeal} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="flex space-x-4 overflow-x-auto pb-4 hide-scrollbar">
          {stages.map((stage) => (
            <div key={stage} className="flex-shrink-0 w-80">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{stage}</h3>
                  <span
                    className="ml-2 text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: getStageColor(stage).bg,
                      color: getStageColor(stage).text,
                      boxShadow: getStageColor(stage).shadow
                    }}
                  >
                    {(dealsByStage[stage] || []).length}
                  </span>
                </div>
              </div>

              <div
                className="space-y-3 min-h-[200px] p-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--pipeline-column-bg)',
                  borderColor: 'var(--border-dark)'
                }}
              >
                {(dealsByStage[stage] || []).map((deal) => (
                  <DealCard key={deal.id} deal={deal} isDraggable={false} />
                ))}

                {(dealsByStage[stage] || []).length === 0 && (
                  <div
                    className="h-24 flex items-center justify-center rounded-lg border-2 border-dashed"
                    style={{
                      borderColor: 'var(--border-dark)',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <p className="text-sm">No deals in this stage</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function for read-only view
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
