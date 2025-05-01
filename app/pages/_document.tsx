import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="dark" suppressHydrationWarning>
      <Head />
      <body suppressHydrationWarning>
        {/* Script to remove browser extension attributes before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Run before React hydrates the page
                var observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName.startsWith('bis_')) {
                      mutation.target.removeAttribute(mutation.attributeName);
                    }
                  });
                });
                
                // Start observing the document with the configured parameters
                observer.observe(document.body, {
                  attributes: true,
                  childList: true,
                  subtree: true,
                  attributeFilter: ['bis_skin_checked', 'bis_register']
                });
                
                // Also clean up any existing attributes
                document.querySelectorAll('[bis_skin_checked], [bis_register]').forEach(function(el) {
                  el.removeAttribute('bis_skin_checked');
                  el.removeAttribute('bis_register');
                });
              })();
            `,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
