'use client';

import React, { useEffect, useState } from 'react';

interface HydrationErrorBoundaryProps {
  children: React.ReactNode;
}

export default function HydrationErrorBoundary({ children }: HydrationErrorBoundaryProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This will only run on the client, after hydration
    setIsClient(true);

    // Clean up any browser extension attributes
    const cleanupAttributes = () => {
      document.querySelectorAll('[bis_skin_checked], [bis_register]').forEach((el) => {
        if (el instanceof HTMLElement) {
          el.removeAttribute('bis_skin_checked');
          el.removeAttribute('bis_register');
        }
      });
    };

    // Run cleanup immediately and set up a MutationObserver
    cleanupAttributes();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          (mutation.attributeName?.startsWith('bis_') || mutation.attributeName?.includes('__processed'))
        ) {
          const target = mutation.target as HTMLElement;
          target.removeAttribute(mutation.attributeName);
        }
      });
    });

    // Start observing the document
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['bis_skin_checked', 'bis_register', '__processed']
    });

    return () => {
      // Clean up the observer when the component unmounts
      observer.disconnect();
    };
  }, []);

  // During SSR and initial client render, use a simplified version
  if (!isClient) {
    return <>{children}</>;
  }

  // After hydration, render the children normally
  return <>{children}</>;
}
