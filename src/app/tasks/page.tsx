'use client';

import { useState } from 'react';
import { useAllTasks, useUpdateTask, useDeleteTask, useCreateTask } from '@/hooks/useTasks';
import { format } from 'date-fns';

export default function TasksPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Fetch tasks with React Query
  const { data, isLoading, error } = useAllTasks(
    filter === 'all' ? undefined : filter === 'completed'
  );

  // Task mutations
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const createTaskMutation = useCreateTask();

  // Filter tasks by priority
  const filteredTasks = data?.tasks ? data.tasks.filter(task => {
    if (priorityFilter === 'all') return true;
    return task.priority === priorityFilter.toLowerCase();
  }) : [];

  // Handle task completion toggle
  const handleToggleComplete = (taskId: string, completed: boolean) => {
    updateTaskMutation.mutate({
      taskId,
      data: { completed: !completed }
    });
  };

  // Handle task deletion
  const handleDeleteTask = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Tasks</h1>
        <button
          className="px-4 py-2 bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white rounded-md hover:shadow-accent-glow transition-all duration-200"
          onClick={() => {
            // In a real app, this would open a modal to create a new task
            alert('This would open a task creation modal in a real app');
          }}
        >
          Add New Task
        </button>
      </div>

      <div className="bg-dark-card rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-dark-border flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Task List</h2>
          <div className="flex space-x-2">
            <select
              className="bg-dark-bg text-text-secondary border border-dark-border rounded-md px-3 py-1 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
            <select
              className="bg-dark-bg text-text-secondary border border-dark-border rounded-md px-3 py-1 text-sm"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading tasks...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-error">
            <p>Error loading tasks. Please try again.</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">
            <p>No tasks found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-dark-card-hover transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleComplete(task.id, task.completed)}
                          className="mr-3 h-4 w-4 rounded border-dark-border text-accent focus:ring-accent"
                        />
                        <div className={`text-sm font-medium ${task.completed ? 'text-text-secondary line-through' : 'text-white'}`}>
                          {task.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          task.completed
                            ? 'bg-success/20 text-success'
                            : 'bg-info/20 text-info'
                        }`}
                      >
                        {task.completed ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-text-secondary">
                        {format(new Date(task.due_date), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          task.priority === 'high'
                            ? 'bg-error/20 text-error'
                            : task.priority === 'medium'
                            ? 'bg-warning/20 text-warning'
                            : 'bg-success/20 text-success'
                        }`}
                      >
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-text-secondary">
                      <div className="flex space-x-2">
                        <button
                          className="text-accent hover:text-white transition-colors"
                          onClick={() => {
                            // In a real app, this would open a modal to edit the task
                            alert(`This would open a modal to edit task: ${task.title}`);
                          }}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          className="text-error hover:text-white transition-colors"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
