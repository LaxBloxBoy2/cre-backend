'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { Command } from 'cmdk';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Skeleton } from './ui/skeleton';

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Fetch deals for quick navigation
  const { data: deals, isLoading: dealsLoading } = useQuery({
    queryKey: ['deals-command'],
    queryFn: () => api.get('/api/deals').then(res => res.data),
    enabled: open,
  });

  // Handle keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Log when command palette is opened
  useEffect(() => {
    if (open) {
      console.log('Command palette opened');
    }
  }, [open]);

  // Handle command selection
  const runCommand = (command: () => unknown) => {
    setOpen(false);
    command();
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-dark-card rounded-lg shadow-lg z-50 overflow-hidden border border-dark-border">
          <Command className="w-full" label="Command Menu">
            <div className="flex items-center border-b border-dark-border p-4">
              <svg
                className="h-5 w-5 text-text-secondary mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <Command.Input
                className="flex-1 bg-transparent outline-none text-white placeholder:text-text-secondary"
                placeholder="Search commands, deals, pages..."
                value={search}
                onValueChange={setSearch}
              />
              <kbd className="ml-2 px-2 py-1 text-xs text-text-secondary bg-dark-card-hover rounded">
                ESC
              </kbd>
            </div>

            <Command.List className="max-h-[300px] overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-text-secondary">
                No results found.
              </Command.Empty>

              {/* Navigation Section */}
              <Command.Group heading="Navigation">
                <Command.Item
                  onSelect={() => runCommand(() => router.push('/dashboard'))}
                  className="flex items-center px-2 py-1 rounded cursor-pointer hover:bg-dark-card-hover text-white"
                >
                  <svg
                    className="h-4 w-4 mr-2 text-text-secondary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Dashboard
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => router.push('/deals'))}
                  className="flex items-center px-2 py-1 rounded cursor-pointer hover:bg-dark-card-hover text-white"
                >
                  <svg
                    className="h-4 w-4 mr-2 text-text-secondary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  All Deals
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => router.push('/calendar'))}
                  className="flex items-center px-2 py-1 rounded cursor-pointer hover:bg-dark-card-hover text-white"
                >
                  <svg
                    className="h-4 w-4 mr-2 text-text-secondary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Calendar
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => router.push('/lp'))}
                  className="flex items-center px-2 py-1 rounded cursor-pointer hover:bg-dark-card-hover text-white"
                >
                  <svg
                    className="h-4 w-4 mr-2 text-text-secondary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  LP Portal
                </Command.Item>
              </Command.Group>

              {/* Deals Section */}
              <Command.Group heading="Deals">
                {dealsLoading ? (
                  <div className="space-y-2 py-1">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ) : deals?.length > 0 ? (
                  deals.map((deal: any) => (
                    <Command.Item
                      key={deal.id}
                      onSelect={() => runCommand(() => router.push(`/deals/${deal.id}`))}
                      className="flex items-center px-2 py-1 rounded cursor-pointer hover:bg-dark-card-hover text-white"
                    >
                      <svg
                        className="h-4 w-4 mr-2 text-text-secondary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      {deal.project_name}
                    </Command.Item>
                  ))
                ) : (
                  <div className="py-6 text-center text-text-secondary">
                    No deals found.
                  </div>
                )}
              </Command.Group>

              {/* Actions Section */}
              <Command.Group heading="Actions">
                <Command.Item
                  onSelect={() => runCommand(() => router.push('/deals/new'))}
                  className="flex items-center px-2 py-1 rounded cursor-pointer hover:bg-dark-card-hover text-white"
                >
                  <svg
                    className="h-4 w-4 mr-2 text-text-secondary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Create New Deal
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => window.open('/api/docs', '_blank'))}
                  className="flex items-center px-2 py-1 rounded cursor-pointer hover:bg-dark-card-hover text-white"
                >
                  <svg
                    className="h-4 w-4 mr-2 text-text-secondary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  API Documentation
                </Command.Item>
              </Command.Group>
            </Command.List>

            <div className="border-t border-dark-border p-2">
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <div className="flex space-x-2">
                  <div className="flex items-center">
                    <kbd className="px-1.5 py-0.5 bg-dark-card-hover rounded">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-dark-card-hover rounded ml-1">↓</kbd>
                    <span className="ml-1">Navigate</span>
                  </div>
                  <div className="flex items-center">
                    <kbd className="px-1.5 py-0.5 bg-dark-card-hover rounded">Enter</kbd>
                    <span className="ml-1">Select</span>
                  </div>
                </div>
                <div>
                  <span>Press </span>
                  <kbd className="px-1.5 py-0.5 bg-dark-card-hover rounded">Cmd</kbd>
                  <span> + </span>
                  <kbd className="px-1.5 py-0.5 bg-dark-card-hover rounded">K</kbd>
                  <span> to open</span>
                </div>
              </div>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
