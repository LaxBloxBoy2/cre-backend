'use client';

import { useState } from 'react';
import Image from 'next/image';

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

interface TaskRowProps {
  task: Task;
  onToggleComplete: (taskId: string, completed: boolean) => void;
}

export default function TaskRow({ task, onToggleComplete }: TaskRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleToggleComplete = () => {
    setIsUpdating(true);
    
    // Simulate API call
    setTimeout(() => {
      onToggleComplete(task.id, !task.completed);
      setIsUpdating(false);
    }, 300);
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      default:
        return 'text-green-500';
    }
  };
  
  const formattedDueDate = new Date(task.dueDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  
  const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;
  
  return (
    <div 
      className={`dark-card mb-3 overflow-hidden transition-all duration-300 ${
        task.completed ? 'opacity-70' : ''
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <button
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-all duration-300 ${
                task.completed 
                  ? 'border-accent bg-accent/20' 
                  : 'border-text-secondary'
              }`}
              onClick={handleToggleComplete}
              disabled={isUpdating}
            >
              {task.completed && (
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            
            <div className="flex-1">
              <h3 
                className={`text-base font-medium ${
                  task.completed ? 'text-text-secondary line-through' : 'text-white'
                }`}
              >
                {task.title}
              </h3>
              
              <div className="flex items-center mt-1">
                <span className={`text-xs mr-3 ${getPriorityColor(task.priority)}`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                </span>
                
                <span className={`text-xs ${isOverdue ? 'text-red-500' : 'text-text-secondary'}`}>
                  Due {formattedDueDate}
                  {isOverdue && ' (Overdue)'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="flex -space-x-2 mr-4">
              {task.assignedTo.map((user) => (
                <div key={user.id} className="relative w-8 h-8 rounded-full border-2 border-dark-card">
                  <Image
                    src={user.avatar || '/placeholder-avatar.png'}
                    alt={user.name}
                    fill
                    className="rounded-full object-cover"
                    title={user.name}
                  />
                </div>
              ))}
            </div>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-text-secondary hover:text-white transition-colors"
            >
              <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-dark-card-hover/50 animate-fadeIn">
            <p className="text-sm text-text-secondary mb-4">{task.description}</p>
            
            <div className="flex justify-between text-xs text-text-secondary">
              <div>
                Created by: <span className="text-white">John Doe</span>
              </div>
              <div>
                Last updated: <span className="text-white">2 days ago</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
