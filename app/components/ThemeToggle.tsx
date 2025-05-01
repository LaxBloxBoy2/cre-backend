'use client';

import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { SunIcon, MoonIcon } from '@radix-ui/react-icons';

export default function ThemeToggle({ variant = 'icon' }: { variant?: 'icon' | 'switch' | 'text' }) {
  // Add error handling to prevent crashes
  try {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    // Rest of the component remains the same

  if (variant === 'switch') {
    return (
      <div className="flex items-center space-x-2">
        <SunIcon className={`h-4 w-4 ${isDark ? 'text-text-muted' : 'text-accent'}`} />
        <Switch
          checked={isDark}
          onCheckedChange={toggleTheme}
          aria-label="Toggle theme"
          className="data-[state=checked]:bg-accent"
        />
        <MoonIcon className={`h-4 w-4 ${isDark ? 'text-accent' : 'text-text-muted'}`} />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className="flex items-center space-x-2"
      >
        {isDark ? (
          <>
            <SunIcon className="h-4 w-4 mr-2" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <MoonIcon className="h-4 w-4 mr-2" />
            <span>Dark Mode</span>
          </>
        )}
      </Button>
    );
  }

  // Default icon variant
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className="rounded-full w-8 h-8 p-0"
    >
      {isDark ? (
        <SunIcon className="h-4 w-4 text-accent" />
      ) : (
        <MoonIcon className="h-4 w-4 text-accent" />
      )}
    </Button>
  );
  } catch (error) {
    console.error('Error rendering ThemeToggle:', error);
    // Return a minimal fallback that won't crash
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {}}
        className="rounded-full w-8 h-8 p-0"
      >
        <SunIcon className="h-4 w-4" />
      </Button>
    );
  }
}
