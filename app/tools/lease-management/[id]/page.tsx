'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import {
  Calendar as CalendarIcon,
  Building,
  ArrowLeft,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Clock,
  FileText,
  Mail,
  Phone,
  Briefcase,
  Link as LinkIcon,
  Settings
} from 'lucide-react';
import { useToast } from '@/app/contexts/ToastContext';
import {
  getLeaseById,
  getTenantById,
  deleteLease as mockDeleteLease,
  Lease,
  Tenant
} from '@/app/lib/mock-leases';
import { deleteLease as apiDeleteLease } from '@/app/lib/api';
import { formatCurrency } from '@/app/lib/utils/format';
import { LeaseTimeline } from '@/app/components/lease/LeaseTimeline';
import { LeaseFinancialSummary } from '@/app/components/lease/LeaseFinancialSummary';
import { LeaseDocuments } from '@/app/components/lease/LeaseDocuments';

export default function LeasePage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [lease, setLease] = useState<Lease | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Get lease data
        const leaseId = params.id as string;
        const leaseData = getLeaseById(leaseId);

        if (!leaseData) {
          showToast({
            title: 'Error',
            description: 'Lease not found',
            variant: 'destructive'
          });
          router.push('/tools/lease-management');
          return;
        }

        setLease(leaseData);

        // Get tenant data
        const tenantData = getTenantById(leaseData.tenantId);
        if (tenantData) {
          setTenant(tenantData);
        }
      } catch (error) {
        console.error('Error fetching lease data:', error);
        showToast({
          title: 'Error',
          description: 'Failed to load lease data',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id, router, showToast]);

  const handleDelete = async () => {
    if (!lease) return;

    if (confirm(`Are you sure you want to delete this lease for ${lease.tenantName} at ${lease.assetName}?`)) {
      try {
        // Delete from local storage
        mockDeleteLease(lease.id);

        // Also try to delete via API
        try {
          await apiDeleteLease(lease.id);
        } catch (apiError) {
          console.error('API call failed, but local delete succeeded:', apiError);
        }

        showToast({
          title: 'Success',
          description: 'Lease deleted successfully',
          variant: 'success'
        });

        // Redirect back to lease management
        router.push('/tools/lease-management');
      } catch (error) {
        console.error('Error deleting lease:', error);
        showToast({
          title: 'Error',
          description: 'Failed to delete lease',
          variant: 'destructive'
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center h-64">
          <p>Loading lease data...</p>
        </div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center h-64">
          <p>Lease not found</p>
        </div>
      </div>
    );
  }

  // Calculate lease term in months
  const startDate = new Date(lease.startDate);
  const endDate = new Date(lease.endDate);
  const leaseTerm = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                    (endDate.getMonth() - startDate.getMonth());

  // Calculate annual rent
  const annualRent = lease.baseRent * 12;

  // Calculate rent per square foot
  const rentPerSqFt = lease.baseRent / lease.leaseArea;

  // Calculate annual rent per square foot
  const annualRentPerSqFt = annualRent / lease.leaseArea;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link href="/tools/lease-management" className="mr-4">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Lease Details</h1>
        </div>
        <div className="flex space-x-2">
          <Link href={`/tools/lease-management/tenants/${lease.tenantId}`}>
            <Button variant="outline" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              View Tenant
            </Button>
          </Link>
          <Link href={`/tools/lease-management/${lease.id}/edit`}>
            <Button variant="outline" className="flex items-center">
              <Edit className="mr-2 h-4 w-4" />
              Edit Lease
            </Button>
          </Link>
          <Button variant="outline" className="flex items-center text-destructive hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Lease
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{lease.assetName}</CardTitle>
                  <CardDescription className="text-lg">
                    <Link
                      href={`/tools/lease-management/tenants/${lease.tenantId}`}
                      className="hover:text-blue-500 hover:underline transition-colors"
                    >
                      {lease.tenantName}
                    </Link>
                  </CardDescription>
                </div>
                <Badge variant={
                  lease.status === 'Active' ? 'default' :
                  lease.status === 'Upcoming' ? 'outline' : 'secondary'
                }>
                  {lease.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Lease Type</h3>
                  <p className="text-lg">{lease.leaseType}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Lease Term</h3>
                  <p className="text-lg">{leaseTerm} months</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Start Date</h3>
                  <p className="text-lg flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {format(new Date(lease.startDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">End Date</h3>
                  <p className="text-lg flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {format(new Date(lease.endDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Monthly Base Rent</h3>
                  <p className="text-lg font-medium">{formatCurrency(lease.baseRent)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Annual Rent</h3>
                  <p className="text-lg">{formatCurrency(annualRent)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Rent Escalation</h3>
                  <p className="text-lg">{lease.rentEscalation}% annually</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Security Deposit</h3>
                  <p className="text-lg">{formatCurrency(lease.securityDeposit)}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Lease Area</h3>
                  <p className="text-lg">{lease.leaseArea.toLocaleString()} sq ft</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Rent per Square Foot</h3>
                  <p className="text-lg">{formatCurrency(rentPerSqFt)}/sq ft monthly</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Annual Rent per Square Foot</h3>
                  <p className="text-lg">{formatCurrency(annualRentPerSqFt)}/sq ft annually</p>
                </div>
              </div>

              {lease.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                    <p className="text-base">{lease.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline Component */}
          <LeaseTimeline lease={lease} />

          {/* Documents Component */}
          <LeaseDocuments leaseId={lease.id} />
        </div>

        <div className="space-y-6">
          {/* Financial Summary Component */}
          <LeaseFinancialSummary lease={lease} />

          <Card>
            <CardHeader>
              <CardTitle>Renewal Options</CardTitle>
            </CardHeader>
            <CardContent>
              {lease.renewalOptions && lease.renewalOptions.length > 0 ? (
                <div className="space-y-4">
                  {lease.renewalOptions.map((option, index) => (
                    <div key={option.id} className="border rounded-md p-4">
                      <h3 className="font-medium">Option {index + 1}</h3>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Term</p>
                          <p>{option.term} months</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Notice Required</p>
                          <p>{option.noticeRequired} months</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">Rent Increase</p>
                          <p>{option.rentIncrease}% from current rent</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No renewal options available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Tenant Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tenant ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">{tenant.name}</h3>
                    <Badge variant="outline" className="ml-2">
                      {tenant.type}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {tenant.contactName && (
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{tenant.contactName}</span>
                      </div>
                    )}
                    {tenant.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{tenant.email}</span>
                      </div>
                    )}
                    {tenant.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{tenant.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/tools/lease-management/tenants/${tenant.id}`}
                      className="text-sm text-blue-500 hover:underline flex items-center"
                    >
                      View full tenant profile
                      <ArrowLeft className="h-3 w-3 ml-1 rotate-180" />
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Tenant information not available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lease Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p>{format(new Date(lease.createdAt), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p>{format(new Date(lease.updatedAt), 'MMM d, yyyy')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Integration Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Deal Integration</span>
                  </div>
                  <Badge variant={lease.isIntegratedWithDeals ? "default" : "outline"}>
                    {lease.isIntegratedWithDeals ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Document Integration</span>
                  </div>
                  <Badge variant={lease.isIntegratedWithDocuments ? "default" : "outline"}>
                    {lease.isIntegratedWithDocuments ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Calendar Integration</span>
                  </div>
                  <Badge variant={lease.isIntegratedWithCalendar ? "default" : "outline"}>
                    {lease.isIntegratedWithCalendar ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="pt-2">
                  <Link
                    href="/tools/lease-management/settings"
                    className="text-sm text-blue-500 hover:underline flex items-center"
                  >
                    Manage integration settings
                    <ArrowLeft className="h-3 w-3 ml-1 rotate-180" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
