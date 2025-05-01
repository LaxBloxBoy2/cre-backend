'use client';

// Simple toast hook that just logs to console for now
export const useToast = () => {
  return {
    toast: ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
      // Just log to console for now
      console.log(`Toast (${variant || 'default'}): ${title} - ${description || ''}`);

      // Only show alert in development to avoid annoying users
      if (process.env.NODE_ENV === 'development') {
        // Use console.log instead of alert to avoid blocking UI
        console.log(`%c${title}: ${description || ''}`, 'background: #333; color: #fff; padding: 4px 8px; border-radius: 4px;');
      }
    }
  };
};
