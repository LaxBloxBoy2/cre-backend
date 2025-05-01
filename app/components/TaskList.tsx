'use client';

import { useState, useEffect } from 'react';
import TaskRow from './TaskRow';

interface User {
  id: string;
  name: string;
  avatar: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  completed: boolean;
  assignedTo: User[];
}

interface TaskListProps {
  dealId: string;
}

export default function TaskList({ dealId }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  
  useEffect(() => {
    // Simulate API call to fetch tasks
    setTimeout(() => {
      setTasks([
        {
          id: '1',
          title: 'Clarification of deal details',
          description: 'Reach out to the client to clarify the specifics of the deal structure and timeline expectations.',
          priority: 'high',
          dueDate: '2023-12-15',
          completed: false,
          assignedTo: [
            { id: '1', name: 'John Doe', avatar: '/placeholder-avatar.png' },
            { id: '2', name: 'Jane Smith', avatar: '/placeholder-avatar.png' },
          ],
        },
        {
          id: '2',
          title: 'Prepare financial analysis',
          description: 'Create a comprehensive financial analysis including ROI projections, cash flow models, and sensitivity analysis.',
          priority: 'medium',
          dueDate: '2023-12-20',
          completed: false,
          assignedTo: [
            { id: '3', name: 'Robert Johnson', avatar: '/placeholder-avatar.png' },
          ],
        },
        {
          id: '3',
          title: 'Schedule client meeting',
          description: 'Set up a meeting with the client to discuss progress and next steps.',
          priority: 'low',
          dueDate: '2023-12-10',
          completed: true,
          assignedTo: [
            { id: '1', name: 'John Doe', avatar: '/placeholder-avatar.png' },
          ],
        },
        {
          id: '4',
          title: 'Draft proposal document',
          description: 'Create the initial proposal document outlining the deal structure, terms, and conditions.',
          priority: 'high',
          dueDate: '2023-12-25',
          completed: false,
          assignedTo: [
            { id: '2', name: 'Jane Smith', avatar: '/placeholder-avatar.png' },
            { id: '3', name: 'Robert Johnson', avatar: '/placeholder-avatar.png' },
          ],
        },
      ]);
      setLoading(false);
    }, 1000);
  }, [dealId]);
  
  const handleToggleComplete = (taskId: string, completed: boolean) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed } : task
    ));
    
    // In a real app, you would call the API here
    // Example: api.post(`/api/tasks/${taskId}/complete`, { completed })
  };
  
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });
  
  if (loading) {
    return (
      <div className="dark-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Tasks</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-text-secondary">Loading tasks...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="dark-card">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Tasks</h3>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
                filter === 'all'
                  ? 'bg-dark-card-hover text-accent shadow-accent-glow'
                  : 'bg-dark-card-hover/50 text-text-secondary hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
                filter === 'active'
                  ? 'bg-dark-card-hover text-accent shadow-accent-glow'
                  : 'bg-dark-card-hover/50 text-text-secondary hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${
                filter === 'completed'
                  ? 'bg-dark-card-hover text-accent shadow-accent-glow'
                  : 'bg-dark-card-hover/50 text-text-secondary hover:text-white'
              }`}
            >
              Completed
            </button>
          </div>
        </div>
        
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-secondary">No tasks found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(task => (
              <TaskRow 
                key={task.id} 
                task={task} 
                onToggleComplete={handleToggleComplete} 
              />
            ))}
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-dark-card-hover/50 flex justify-between">
          <button className="text-sm text-accent hover:text-accent/80 transition-colors">
            + Add New Task
          </button>
          
          <div className="text-sm text-text-secondary">
            {tasks.filter(t => t.completed).length} of {tasks.length} tasks completed
          </div>
        </div>
      </div>
    </div>
  );
}
