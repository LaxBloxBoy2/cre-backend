[33mcommit 8514523ed43e1f6afb511b2807f89550085ed629[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mdirect-edit-feature-lfs[m[33m)[m
Author: QAPT Developer <developer@qapt.com>
Date:   Wed Apr 30 18:54:36 2025 +0200

    Add direct edit functionality with localStorage persistence

app/contexts/ToastContext.tsx

[33mcommit d764099635716a47d5e4629d94325b3f6c703ed9[m[33m ([m[1;32mmaster[m[33m)[m
Author: QAPT Developer <developer@qapt.com>
Date:   Wed Apr 30 18:50:51 2025 +0200

    Set up Git LFS for .next directory

app/.gitattributes

[33mcommit 811965400b92a0a321da46b52e6fcb1ae8db86fb[m[33m ([m[1;32mdirect-edit-feature[m[33m)[m
Author: QAPT Developer <developer@qapt.com>
Date:   Wed Apr 30 17:47:23 2025 +0200

    Add direct edit functionality with localStorage persistence

app/deals/[id]/direct-edit/page.tsx
app/deals/[id]/edit/page-direct.tsx
app/deals/[id]/page.tsx
app/lib/api.ts

[33mcommit ef8e60723ba69d2f1fba202a2992c6264d21b788[m
Author: QAPT Developer <developer@qapt.com>
Date:   Wed Apr 30 17:35:20 2025 +0200

    Fix deal editing functionality with localStorage persistence

app/deals/[id]/edit/page.tsx
app/lib/api.ts

[33mcommit 82cf160ac293899c70d6b6620245b1be762ed65d[m
Author: QAPT Developer <developer@qapt.com>
Date:   Wed Apr 30 17:29:55 2025 +0200

    Fix deal editing functionality and add integration settings

app/.next/build-manifest.json
app/.next/cache/.rscinfo
app/.next/cache/webpack/client-development/0.pack.gz
app/.next/cache/webpack/client-development/1.pack.gz
app/.next/cache/webpack/client-development/index.pack.gz
app/.next/cache/webpack/client-development/index.pack.gz.old
app/.next/cache/webpack/server-development/0.pack.gz
app/.next/cache/webpack/server-development/index.pack.gz
app/.next/package.json
app/.next/react-loadable-manifest.json
app/.next/server/_error.js
app/.next/server/interception-route-rewrite-manifest.js
app/.next/server/middleware-build-manifest.js
app/.next/server/middleware-manifest.json
app/.next/server/middleware-react-loadable-manifest.js
app/.next/server/next-font-manifest.js
app/.next/server/next-font-manifest.json
app/.next/server/pages-manifest.json
app/.next/server/pages/_app.js
app/.next/server/pages/_document.js
app/.next/server/pages/_error.js
app/.next/server/vendor-chunks/@swc.js
app/.next/server/vendor-chunks/next.js
app/.next/server/webpack-runtime.js
app/.next/static/chunks/_error.js
app/.next/static/chunks/_pages-dir-browser_node_modules_next_dist_pages__app_js.js
app/.next/static/chunks/_pages-dir-browser_node_modules_next_dist_pages__error_js.js
app/.next/static/chunks/main.js
app/.next/static/chunks/pages/_app.js
app/.next/static/chunks/pages/_error.js
app/.next/static/chunks/polyfills.js
app/.next/static/chunks/react-refresh.js
app/.next/static/chunks/webpack.js
app/.next/static/development/_buildManifest.js
app/.next/static/development/_ssgManifest.js
app/.next/static/webpack/633457081244afec._.hot-update.json
app/.next/trace
app/api/calendar-events/[id]/route.ts
app/components/IntegrationsTab.tsx
app/components/lease-management/EditLeaseForm.tsx
app/components/lease-management/LeaseNavTabs.tsx
app/contexts/ThemeContext.tsx
app/deals/[id]/edit/page.tsx
app/deals/[id]/page.tsx
app/globals.css
app/lib/api.ts
app/lib/api/rent-roll.ts
app/lib/mock-leases.ts
app/tools/lease-management/[id]/edit/page.tsx
app/tools/lease-management/[id]/page.tsx
app/tools/lease-management/page.tsx
app/tools/lease-management/rent-roll/page.tsx
app/tools/lease-management/settings/page.tsx
app/tsconfig.json

[33mcommit 535a2ad5bba3d3ca10fd1b0c9c49e8780af500e4[m
Author: QAPT Developer <developer@qapt.com>
Date:   Wed Apr 30 15:09:28 2025 +0200

    Update API client to use the deployed backend

app/lib/api/client.ts

[33mcommit d3c7a35c3479622119f6893e61512e2f406ec73c[m
Author: QAPT Developer <developer@qapt.com>
Date:   Wed Apr 30 15:05:21 2025 +0200

    Add complete backend implementation for rent roll functionality

backend/database.py
backend/rent_roll_main.py
backend/requirements.txt

[33mcommit 6ba88aa0d2d209f610ba38cd6122d4033c50d62e[m
Author: QAPT Developer <developer@qapt.com>
Date:   Wed Apr 30 02:43:57 2025 +0200

    Add deployment scripts and database migration tools

backend/Procfile
backend/README.md
backend/alembic.ini
backend/create_migration.py
backend/deploy.py
backend/import_data.py
backend/migrations/env.py
backend/migrations/script.py.mako
backend/migrations/versions/.gitkeep

[33mcommit 763e002ccb95696f16044e2ce471b8f3541369aa[m
Author: QAPT Developer <developer@qapt.com>
Date:   Wed Apr 30 02:20:03 2025 +0200

    Update API client to handle missing backend endpoints

app/lib/api/rent-roll.ts
app/tools/lease-management/rent-roll/page.tsx

[33mcommit 1d711d2bfb82cedd49508c5d2d0e43c896085eb4[m
Author: QAPT Developer <developer@qapt.com>
Date:   Wed Apr 30 02:14:26 2025 +0200

    Add debugging for API integration

app/lib/api/client.ts
app/lib/api/rent-roll.ts
app/tools/lease-management/rent-roll/page.tsx

[33mcommit 5dfe1ad8af6944d039434bf525be007d242984b3[m
Author: QAPT Developer <developer@qapt.com>
Date:   Wed Apr 30 01:55:15 2025 +0200

    Add backend for rent roll with API integration

app/lib/api/client.ts
app/lib/api/rent-roll.ts
app/tools/lease-management/rent-roll/page.tsx
backend/models/__init__.py
backend/models/asset.py
backend/models/base.py
backend/models/lease.py
backend/models/tenant.py
backend/rent_roll_main.py
backend/routers/__init__.py
backend/routers/assets.py
backend/routers/leases.py
backend/routers/rent_roll.py
backend/routers/tenants.py
backend/run.py
backend/schemas/__init__.py
backend/schemas/analytics.py
backend/schemas/asset.py
backend/schemas/lease.py
backend/schemas/tenant.py
backend/services/__init__.py
backend/services/analytics_service.py
backend/services/asset_service.py
backend/services/lease_service.py
backend/services/tenant_service.py

[33mcommit 2c73c40d500576385b55aa26c784c09a02846f8e[m
Author: QAPT Developer <developer@qapt.com>
Date:   Wed Apr 30 01:28:38 2025 +0200

    Enhance rent roll page with advanced visualizations

app/tools/lease-management/rent-roll/page.tsx

[33mcommit c4ab45e71d405ead9534fe37dd850997ef051625[m
Author: QAPT Developer <developer@qapt.com>
Date:   Wed Apr 30 01:12:52 2025 +0200

    Fix tenant editing functionality to properly persist changes

.next/app-build-manifest.json
.next/build-manifest.json
.next/react-loadable-manifest.json
.next/server/app-paths-manifest.json
.next/server/middleware-build-manifest.js
.next/server/middleware-react-loadable-manifest.js
.next/server/pages-manifest.json
.next/static/development/_buildManifest.js
.next/trace
app/api/documents/[id]/route.ts
app/api/leases/[leaseId]/documents/[documentId]/route.ts
app/api/leases/[leaseId]/documents/route.ts
app/components/lease-management/InlineLeaseEditor.tsx
app/components/lease-management/LeaseNavTabs.tsx
app/components/lease/LeaseDocumentViewerModal.tsx
app/components/lease/LeaseDocuments.tsx
app/components/lease/LeaseFinancialSummary.tsx
app/components/lease/LeasePDFViewerModal.tsx
app/components/lease/LeaseTimeline.tsx
app/components/ui/checkbox.tsx
app/components/ui/index.ts
app/components/ui/separator.tsx
app/lib/api.ts
app/lib/mock-leases.ts
app/lib/services/document-service.ts
app/lib/utils/index.ts
app/tools/lease-management/[id]/page.tsx
app/tools/lease-management/leases/page.tsx
app/tools/lease-management/page.tsx
app/tools/lease-management/rent-roll/page.tsx
app/tools/lease-management/tenants/[id]/page.tsx
app/tools/lease-management/tenants/page.tsx
node_modules/.package-lock.json
package-lock.json
package.json

[33mcommit 8490cf9940f3bb63a82a676985798630c7dcffda[m
Author: QAPT Developer <developer@qapt.com>
Date:   Tue Apr 29 17:26:21 2025 +0200

    Fix casing issues with UI components and restore providers

.next/app-build-manifest.json
.next/server/app-paths-manifest.json
.next/trace
app/components/ui/index.ts

[33mcommit cfe476fe3bf7b75e6ab5c4e2bb7178096054e63a[m
Author: QAPT Developer <developer@qapt.com>
Date:   Tue Apr 29 16:56:03 2025 +0200

    Add Tenants to sidebar under Leases section

.next/app-build-manifest.json
.next/server/app-paths-manifest.json
.next/trace
app/components/Sidebar.tsx

[33mcommit dfb92f7eba18e250268ac21a2e6b227b0415b624[m
Author: QAPT Developer <developer@qapt.com>
Date:   Tue Apr 29 16:51:49 2025 +0200

    Fix notification bell position and update lease management pages

.next/app-build-manifest.json
.next/server/app-paths-manifest.json
.next/trace
app/components/TopAlerts.tsx
app/tools/lease-management/leases/page.tsx
app/tools/lease-management/rent-roll/page.tsx

[33mcommit e2dbf238b7b12729cf0fa55b6a3740b3d40429d0[m
Author: QAPT Developer <developer@qapt.com>
Date:   Tue Apr 29 15:49:48 2025 +0200

    Add top alerts and update sidebar with Leases section

.next/app-build-manifest.json
.next/server/app-paths-manifest.json
.next/trace
app/components/Sidebar.tsx
app/components/TopAlerts.tsx
app/components/Topbar.tsx
app/tools/lease-management/leases/page.tsx
app/tools/lease-management/rent-roll/page.tsx

[33mcommit bb98d7e84b485b68f85c0827fed6c8c1f7fea32a[m
Author: QAPT Developer <developer@qapt.com>
Date:   Tue Apr 29 15:39:57 2025 +0200

    Fix toast dependency in useEffect hook

.next/app-build-manifest.json
.next/react-loadable-manifest.json
.next/server/app-paths-manifest.json
.next/server/middleware-react-loadable-manifest.js
.next/trace
app/tools/lease-management/tenants/[id]/page.tsx
