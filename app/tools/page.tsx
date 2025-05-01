'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function ToolsHubPage() {
  const router = useRouter();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Tools</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Doc Room Card */}
        <Card className="bg-dark-card border-dark-border hover:border-accent/50 transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-white">Doc Room</CardTitle>
            <CardDescription className="text-text-secondary">
              Manage and organize all your deal documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-text-secondary">
              Upload, categorize, and share documents related to your deals. Keep everything organized in one place.
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => router.push('/tools/doc-room')}
              className="w-full bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white hover:shadow-accent-glow"
            >
              Open Doc Room
            </Button>
          </CardFooter>
        </Card>

        {/* e-Signature Card */}
        <Card className="bg-dark-card border-dark-border hover:border-accent/50 transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-white">e-Signature</CardTitle>
            <CardDescription className="text-text-secondary">
              Send and track document signatures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-text-secondary">
              Send documents for electronic signature, track status, and get notified when documents are signed.
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => router.push('/tools/e-signature')}
              className="w-full bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white hover:shadow-accent-glow"
            >
              Open e-Signature
            </Button>
          </CardFooter>
        </Card>

        {/* Invoices Card */}
        <Card className="bg-dark-card border-dark-border hover:border-accent/50 transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-white">Invoices</CardTitle>
            <CardDescription className="text-text-secondary">
              Manage and process invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-text-secondary">
              Upload, process, and track invoices. Extract data automatically and manage approval workflows.
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => router.push('/tools/invoices')}
              className="w-full bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white hover:shadow-accent-glow"
            >
              Open Invoices
            </Button>
          </CardFooter>
        </Card>

        {/* Bulk Import Card */}
        <Card className="bg-dark-card border-dark-border hover:border-accent/50 transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-white">Bulk Import</CardTitle>
            <CardDescription className="text-text-secondary">
              Import multiple deals at once
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-text-secondary">
              Quickly import multiple deals from Excel or CSV files. Save time by uploading data in bulk rather than entering manually.
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => router.push('/tools/bulk-import')}
              className="w-full bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white hover:shadow-accent-glow"
            >
              Open Bulk Import
            </Button>
          </CardFooter>
        </Card>

        {/* Lease Management Card */}
        <Card className="bg-dark-card border-dark-border hover:border-accent/50 transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-white">Lease Management</CardTitle>
            <CardDescription className="text-text-secondary">
              Track leases, tenants, and rent rolls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-text-secondary">
              Manage commercial leases, track expirations, monitor tenant information, and visualize rent rolls across your portfolio.
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => router.push('/tools/lease-management')}
              className="w-full bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white hover:shadow-accent-glow"
            >
              Open Lease Management
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
