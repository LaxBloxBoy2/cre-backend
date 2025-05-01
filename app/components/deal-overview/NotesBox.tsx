'use client';

import React, { useState, useEffect } from 'react';
import { getDealComments, createDealComment } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { formatRelativeTime } from '../../lib/utils/date';

interface Comment {
  id: string;
  text: string;
  author: string;
  created_at: string;
  user_id: string;
}

interface NotesBoxProps {
  dealId: string;
}

export default function NotesBox({ dealId }: NotesBoxProps) {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  // Fetch comments when the component mounts
  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        // In a real app, this would call the API
        if (process.env.NODE_ENV === 'production') {
          const comments = await getDealComments(dealId);
          setNotes(comments);
        } else {
          // Use mock data for development
          await new Promise(resolve => setTimeout(resolve, 1000));
          setNotes([
    {
      id: '1',
      text: 'Spoke with the property manager today. They mentioned that the HVAC system was upgraded last year.',
      author: 'John Doe',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      user_id: 'user1',
    },
          ]);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
        showToast('Failed to load comments. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [dealId, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    setSubmitting(true);
    try {
      // In a real app, this would call the API
      if (process.env.NODE_ENV === 'production') {
        const newComment = await createDealComment(dealId, note);
        setNotes(prevNotes => [newComment, ...prevNotes]);
      } else {
        // Simulate API call for development
        await new Promise(resolve => setTimeout(resolve, 500));
        const newComment: Comment = {
          id: Date.now().toString(),
          text: note,
          author: 'You',
          created_at: new Date().toISOString(),
          user_id: 'current-user',
        };
        setNotes(prevNotes => [newComment, ...prevNotes]);
      }
      setNote('');
      showToast('Comment added successfully!', 'success');
    } catch (error) {
      console.error('Error creating comment:', error);
      showToast('Failed to add comment. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dark-card shadow-lg rounded-lg overflow-hidden transition-all duration-200 hover:shadow-accent-glow/10">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-dark-card-hover">
        <div className="flex items-center">
          <h3 className="text-lg leading-6 font-medium text-white">Notes</h3>
          <div className="ml-2 group relative">
            <svg
              className="h-5 w-5 text-text-secondary cursor-help"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-sm text-white bg-dark-card-hover border border-dark-card-hover rounded-md shadow-lg">
              Visible to all team members
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <form onSubmit={handleSubmit}>
          <div className="mt-1">
            <textarea
              rows={3}
              className="shadow-sm focus:ring-accent focus:border-accent block w-full sm:text-sm border border-dark-card-hover bg-dark-card-hover text-white rounded-md placeholder-text-secondary"
              placeholder="Add a note about this property..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            ></textarea>
          </div>
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-[#30E3CA] to-[#11999E] hover:shadow-accent-glow transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Posting...
                </>
              ) : (
                'Post'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 flow-root">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <svg className="animate-spin h-6 w-6 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-sm text-text-secondary">Loading comments...</span>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-text-secondary">No comments yet. Be the first to add a note!</p>
            </div>
          ) : (
            <ul className="-my-5 divide-y divide-dark-card-hover">
              {notes.map((note) => (
                <li key={note.id} className="py-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#30E3CA] to-[#11999E] flex items-center justify-center">
                        <span className="text-white font-medium text-sm">{note.author.charAt(0)}</span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">{note.author}</p>
                      <p className="text-sm text-text-secondary">{formatRelativeTime(note.created_at)}</p>
                      <div className="mt-2 text-sm text-white">{note.text}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
