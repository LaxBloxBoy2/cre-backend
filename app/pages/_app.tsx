import type { AppProps } from 'next/app';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Clean up browser extension attributes on mount
    const cleanupAttributes = () => {
      document.querySelectorAll('[bis_skin_checked], [bis_register], [__processed]').forEach((el) => {
        if (el instanceof HTMLElement) {
          el.removeAttribute('bis_skin_checked');
          el.removeAttribute('bis_register');
          el.removeAttribute('__processed');
        }
      });
    };

    // Run cleanup immediately
    cleanupAttributes();

    // Set up a MutationObserver to clean up attributes as they're added
    const observer = new MutationObserver((mutations) => {
      let shouldCleanup = false;
      
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          (mutation.attributeName?.startsWith('bis_') || mutation.attributeName?.includes('__processed'))
        ) {
          shouldCleanup = true;
        }
      });
      
      if (shouldCleanup) {
        cleanupAttributes();
      }
    });

    // Start observing the document
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true
    });

    // Also run cleanup periodically as a fallback
    const interval = setInterval(cleanupAttributes, 100);

    return () => {
      // Clean up the observer and interval when the component unmounts
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
