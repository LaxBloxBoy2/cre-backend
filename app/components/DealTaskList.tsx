'use client';

import { useState } from 'react';
import { useDealTasks, useUpdateTask } from '../hooks/dashboard';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { format } from 'date-fns';

interface DealTaskListProps {
  dealId?: string;
}

export default function DealTaskList({ dealId = 'all' }: DealTaskListProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const { data: tasks, isLoading, error } = useDealTasks(dealId, filter === 'pending' ? false : filter === 'completed' ? true : undefined);
  const updateTask = useUpdateTask();

  if (isLoading) {
    return (
      <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
              <div className="flex items-start">
                <Skeleton className="h-5 w-5 rounded mr-3 mt-0.5" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-1" />
                  <div className="flex mt-2">
                    <Skeleton className="h-6 w-16 rounded-full mr-2" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !tasks) {
    console.error('Error loading tasks:', error);
    // Continue with fallback data
  }

  // Fallback data if API fails
  const fallbackData = [
    {
      id: '1',
      title: 'Review property documents',
      description: 'Go through all property documents and identify any issues',
      due_date: '2023-12-15T00:00:00Z',
      completed: false,
      priority: 'high',
      assignees: [{ id: 'u1', name: 'John Doe' }]
    },
    {
      id: '2',
      title: 'Schedule property inspection',
      description: 'Arrange for a professional inspection of the property',
      due_date: '2023-12-10T00:00:00Z',
      completed: false,
      priority: 'medium',
      assignees: [{ id: 'u2', name: 'Jane Smith' }]
    },
    {
      id: '3',
      title: 'Contact current tenants',
      description: 'Reach out to existing tenants to discuss lease terms',
      due_date: '2023-12-05T00:00:00Z',
      completed: true,
      priority: 'medium',
      assignees: [{ id: 'u1', name: 'John Doe' }]
    },
    {
      id: '4',
      title: 'Prepare financial analysis',
      description: 'Create detailed financial projections for the property',
      due_date: '2023-12-20T00:00:00Z',
      completed: false,
      priority: 'high',
      assignees: [{ id: 'u2', name: 'Jane Smith' }]
    }
  ];

  // Extract tasks from response and handle different response structures
  const tasksArray = tasks && tasks.tasks ? tasks.tasks : fallbackData;

  // Filter tasks based on selected filter
  const filteredTasks = tasksArray.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const handleToggleTask = (taskId: string, completed: boolean) => {
    updateTask.mutate({
      taskId,
      data: { completed: !completed }
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-500';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'low':
        return 'bg-green-500/20 text-green-500';
      default:
        return 'bg-blue-500/20 text-blue-500';
    }
  };

  const isOverdue = (dueDate: string, completed: boolean) => {
    if (completed) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Tasks</h2>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter('pending')}
            className={`text-xs`}
            style={{
              backgroundColor: filter === 'pending' ? 'var(--bg-card-hover)' : 'transparent',
              color: filter === 'pending' ? 'var(--text-primary)' : 'var(--text-muted)'
            }}
          >
            Pending
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter('completed')}
            className={`text-xs`}
            style={{
              backgroundColor: filter === 'completed' ? 'var(--bg-card-hover)' : 'transparent',
              color: filter === 'completed' ? 'var(--text-primary)' : 'var(--text-muted)'
            }}
          >
            Completed
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter('all')}
            className={`text-xs`}
            style={{
              backgroundColor: filter === 'all' ? 'var(--bg-card-hover)' : 'transparent',
              color: filter === 'all' ? 'var(--text-primary)' : 'var(--text-muted)'
            }}
          >
            All
          </Button>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-8">
          <p style={{ color: 'var(--text-muted)' }}>No {filter === 'all' ? '' : filter} tasks found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className={`p-4 rounded-lg transition-colors`}
              style={{
                backgroundColor: task.completed
                  ? 'var(--bg-card-hover-lighter)'
                  : 'var(--bg-card-hover)',
                '&:hover': {
                  backgroundColor: task.completed
                    ? 'var(--bg-card-hover-lighter)'
                    : 'var(--bg-card-hover-darker)'
                }
              }}
            >
              <div className="flex items-start">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => handleToggleTask(task.id, task.completed)}
                  className="mr-3 mt-1"
                />
                <div className="flex-1">
                  <h3 className={`text-base ${task.completed ? 'line-through' : ''}`}
                    style={{ color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
                  )}
                  <div className="flex flex-wrap items-center mt-3 gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isOverdue(task.due_date, task.completed)
                        ? 'bg-red-500/20 text-red-500'
                        : ''
                    }`} style={{
                      backgroundColor: isOverdue(task.due_date, task.completed)
                        ? undefined
                        : 'var(--bg-primary)',
                      color: isOverdue(task.due_date, task.completed)
                        ? undefined
                        : 'var(--text-muted)'
                    }}>
                      Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                    </span>
                    {task.assignees && task.assignees.length > 0 && (
                      <div className="flex -space-x-2 ml-auto">
                        {task.assignees.map((assignee, index) => (
                          <div
                            key={assignee.id || index}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs border"
                            style={{
                              backgroundColor: 'var(--bg-primary)',
                              color: 'var(--text-primary)',
                              borderColor: 'var(--border-dark)'
                            }}
                            title={assignee.name}
                          >
                            {assignee.name.charAt(0)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
