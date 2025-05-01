// Mock lease data for development
import { generateUUID } from './mock-funds';

export interface Lease {
  id: string;
  assetId: string;
  assetName: string;
  tenantId: string;
  tenantName: string;
  leaseType: 'Office' | 'Retail' | 'Industrial' | 'Multifamily' | 'Mixed-Use';
  startDate: string;
  endDate: string;
  baseRent: number; // Monthly base rent
  rentEscalation: number; // Annual percentage increase
  securityDeposit: number;
  leaseArea: number; // Square footage
  status: 'Active' | 'Expired' | 'Upcoming';
  renewalOptions: RenewalOption[];
  notes: string;
  createdAt: string;
  updatedAt: string;

  // Integration settings
  isIntegratedWithDeals?: boolean;
  isIntegratedWithDocuments?: boolean;
  isIntegratedWithCalendar?: boolean;
  dealId?: string;
}

export interface RenewalOption {
  id: string;
  term: number; // In months
  noticeRequired: number; // In months
  rentIncrease: number; // Percentage increase from current rent
}

export interface SatisfactionRecord {
  id: string;
  date: string;
  rating: number; // 1-5 scale
  feedback?: string;
  recordedBy: string;
}

export interface CommunicationRecord {
  id: string;
  date: string;
  type: 'Email' | 'Phone' | 'Meeting' | 'Letter' | 'Other';
  subject: string;
  description: string;
  outcome?: string;
  followUpDate?: string;
  contactPerson: string;
  recordedBy: string;
}

export interface CustomField {
  id: string;
  name: string;
  value: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[]; // For select type
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  industry: string;
  creditRating: string;
  paymentHistory: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  notes: string;
  createdAt: string;
  updatedAt: string;

  // Additional company information
  yearFounded?: number;
  companySize?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;

  // Financial health indicators
  annualRevenue?: number;
  profitMargin?: number;
  debtToEquityRatio?: number;
  currentRatio?: number;
  quickRatio?: number;

  // Satisfaction tracking
  satisfactionRating?: number; // 1-5 scale
  satisfactionHistory?: SatisfactionRecord[];

  // Communication history
  communicationHistory?: CommunicationRecord[];

  // Custom fields
  customFields?: CustomField[];
}

// Mock data
export const mockTenants: Tenant[] = [
  {
    id: "t1-abc-123",
    name: "Acme Corporation",
    contactName: "John Smith",
    contactEmail: "john.smith@acme.com",
    contactPhone: "(212) 555-1234",
    industry: "Technology",
    creditRating: "A+",
    paymentHistory: "Excellent",
    notes: "Long-term tenant since 2015",
    createdAt: "2022-01-15T00:00:00Z",
    updatedAt: "2023-06-10T00:00:00Z",

    // Additional company information
    yearFounded: 1985,
    companySize: "500-1000",
    website: "https://www.acmecorp.com",
    address: "123 Tech Blvd",
    city: "New York",
    state: "NY",
    zipCode: "10001",

    // Financial health indicators
    annualRevenue: 75000000,
    profitMargin: 18.5,
    debtToEquityRatio: 0.8,
    currentRatio: 2.1,
    quickRatio: 1.8,

    // Satisfaction tracking
    satisfactionRating: 4.8,
    satisfactionHistory: [
      {
        id: "sat-1-abc",
        date: "2023-06-01T00:00:00Z",
        rating: 5,
        feedback: "Very satisfied with property management and maintenance response times",
        recordedBy: "Jane Doe"
      },
      {
        id: "sat-2-abc",
        date: "2022-12-15T00:00:00Z",
        rating: 4,
        feedback: "Generally satisfied but had some issues with HVAC system",
        recordedBy: "Jane Doe"
      }
    ],

    // Communication history
    communicationHistory: [
      {
        id: "comm-1-abc",
        date: "2023-07-15T00:00:00Z",
        type: "Meeting",
        subject: "Lease Renewal Discussion",
        description: "Met with John Smith to discuss upcoming lease renewal and potential expansion",
        outcome: "Tenant interested in expanding to adjacent space",
        followUpDate: "2023-08-01T00:00:00Z",
        contactPerson: "John Smith",
        recordedBy: "Jane Doe"
      },
      {
        id: "comm-2-abc",
        date: "2023-05-20T00:00:00Z",
        type: "Email",
        subject: "Maintenance Request",
        description: "Received email about HVAC issues in north wing",
        outcome: "Scheduled maintenance for May 22",
        contactPerson: "John Smith",
        recordedBy: "Jane Doe"
      }
    ],

    // Custom fields
    customFields: [
      {
        id: "cf-1-abc",
        name: "Preferred Contact Method",
        value: "Email",
        type: "select",
        options: ["Email", "Phone", "In-person"],
        createdAt: "2023-01-15T00:00:00Z"
      },
      {
        id: "cf-2-abc",
        name: "Expansion Interest",
        value: "Yes",
        type: "boolean",
        createdAt: "2023-03-20T00:00:00Z"
      },
      {
        id: "cf-3-abc",
        name: "Last Meeting",
        value: "2023-07-15",
        type: "date",
        createdAt: "2023-07-16T00:00:00Z"
      }
    ]
  },
  {
    id: "t2-def-456",
    name: "Global Retail Inc.",
    contactName: "Sarah Johnson",
    contactEmail: "sarah.j@globalretail.com",
    contactPhone: "(415) 555-6789",
    industry: "Retail",
    creditRating: "B",
    paymentHistory: "Good",
    notes: "Occasional late payments but always resolves quickly",
    createdAt: "2021-08-22T00:00:00Z",
    updatedAt: "2023-05-15T00:00:00Z",

    // Additional company information
    yearFounded: 2005,
    companySize: "100-500",
    website: "https://www.globalretailinc.com",
    address: "456 Market Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94105",

    // Financial health indicators
    annualRevenue: 28000000,
    profitMargin: 8.2,
    debtToEquityRatio: 1.2,
    currentRatio: 1.5,
    quickRatio: 1.1,

    // Satisfaction tracking
    satisfactionRating: 3.5,
    satisfactionHistory: [
      {
        id: "sat-1-def",
        date: "2023-04-10T00:00:00Z",
        rating: 3,
        feedback: "Concerned about foot traffic in the area",
        recordedBy: "Mark Wilson"
      }
    ],

    // Communication history
    communicationHistory: [
      {
        id: "comm-1-def",
        date: "2023-06-05T00:00:00Z",
        type: "Phone",
        subject: "Late Payment Discussion",
        description: "Called Sarah regarding May payment being 5 days late",
        outcome: "Payment processed same day, promised to be on time in future",
        contactPerson: "Sarah Johnson",
        recordedBy: "Mark Wilson"
      }
    ]
  },
  {
    id: "t3-ghi-789",
    name: "Sunshine Cafe",
    contactName: "Michael Brown",
    contactEmail: "michael@sunshinecafe.com",
    contactPhone: "(312) 555-4321",
    industry: "Food & Beverage",
    creditRating: "B+",
    paymentHistory: "Fair",
    notes: "Struggling during COVID but improving",
    createdAt: "2020-11-05T00:00:00Z",
    updatedAt: "2023-04-20T00:00:00Z",

    // Additional company information
    yearFounded: 2015,
    companySize: "10-50",
    website: "https://www.sunshinecafe.com",
    address: "789 Oak Street",
    city: "Chicago",
    state: "IL",
    zipCode: "60611",

    // Financial health indicators
    annualRevenue: 1200000,
    profitMargin: 5.5,
    debtToEquityRatio: 1.8,
    currentRatio: 1.2,
    quickRatio: 0.9,

    // Satisfaction tracking
    satisfactionRating: 3.0,
    satisfactionHistory: [
      {
        id: "sat-1-ghi",
        date: "2023-03-15T00:00:00Z",
        rating: 3,
        feedback: "Satisfied with location but concerned about rent increases",
        recordedBy: "Mark Wilson"
      }
    ],

    // Communication history
    communicationHistory: [
      {
        id: "comm-1-ghi",
        date: "2023-05-12T00:00:00Z",
        type: "Meeting",
        subject: "Business Recovery Plan",
        description: "Met with Michael to discuss post-COVID recovery and potential rent adjustments",
        outcome: "Agreed to 3-month rent reduction with gradual return to full rate",
        followUpDate: "2023-08-12T00:00:00Z",
        contactPerson: "Michael Brown",
        recordedBy: "Jane Doe"
      }
    ]
  },
  {
    id: "t4-jkl-012",
    name: "Legal Partners LLP",
    contactName: "Jennifer Davis",
    contactEmail: "jdavis@legalpartners.com",
    contactPhone: "(202) 555-8765",
    industry: "Legal Services",
    creditRating: "A",
    paymentHistory: "Excellent",
    notes: "Expanding to additional floor next year",
    createdAt: "2019-06-30T00:00:00Z",
    updatedAt: "2023-03-12T00:00:00Z",

    // Additional company information
    yearFounded: 1998,
    companySize: "50-100",
    website: "https://www.legalpartnersllp.com",
    address: "1200 Pennsylvania Ave",
    city: "Washington",
    state: "DC",
    zipCode: "20004",

    // Financial health indicators
    annualRevenue: 22000000,
    profitMargin: 22.5,
    debtToEquityRatio: 0.5,
    currentRatio: 2.8,
    quickRatio: 2.5,

    // Satisfaction tracking
    satisfactionRating: 4.5,
    satisfactionHistory: [
      {
        id: "sat-1-jkl",
        date: "2023-02-20T00:00:00Z",
        rating: 5,
        feedback: "Very happy with the property and management team",
        recordedBy: "Jane Doe"
      },
      {
        id: "sat-2-jkl",
        date: "2022-08-10T00:00:00Z",
        rating: 4,
        feedback: "Generally satisfied but would like more parking options",
        recordedBy: "Mark Wilson"
      }
    ],

    // Communication history
    communicationHistory: [
      {
        id: "comm-1-jkl",
        date: "2023-04-05T00:00:00Z",
        type: "Meeting",
        subject: "Expansion Planning",
        description: "Met with Jennifer to discuss expansion to 5th floor",
        outcome: "Provided floor plans and pricing, awaiting board approval",
        followUpDate: "2023-05-15T00:00:00Z",
        contactPerson: "Jennifer Davis",
        recordedBy: "Jane Doe"
      }
    ]
  },
  {
    id: "t5-mno-345",
    name: "Fitness Evolution",
    contactName: "Robert Wilson",
    contactEmail: "robert@fitnessevo.com",
    contactPhone: "(305) 555-9876",
    industry: "Health & Fitness",
    creditRating: "C+",
    paymentHistory: "Poor",
    notes: "Frequently late on payments, considering termination",
    createdAt: "2022-03-18T00:00:00Z",
    updatedAt: "2023-07-01T00:00:00Z",

    // Additional company information
    yearFounded: 2018,
    companySize: "10-50",
    website: "https://www.fitnessevolution.com",
    address: "500 Beach Drive",
    city: "Miami",
    state: "FL",
    zipCode: "33139",

    // Financial health indicators
    annualRevenue: 850000,
    profitMargin: 3.2,
    debtToEquityRatio: 2.5,
    currentRatio: 0.9,
    quickRatio: 0.7,

    // Satisfaction tracking
    satisfactionRating: 2.0,
    satisfactionHistory: [
      {
        id: "sat-1-mno",
        date: "2023-06-10T00:00:00Z",
        rating: 2,
        feedback: "Unhappy with maintenance response times and feels rent is too high",
        recordedBy: "Mark Wilson"
      }
    ],

    // Communication history
    communicationHistory: [
      {
        id: "comm-1-mno",
        date: "2023-07-02T00:00:00Z",
        type: "Phone",
        subject: "Late Payment Warning",
        description: "Called Robert about consistently late payments and final warning",
        outcome: "Promised to pay on time going forward, cited cash flow issues",
        followUpDate: "2023-08-01T00:00:00Z",
        contactPerson: "Robert Wilson",
        recordedBy: "Mark Wilson"
      },
      {
        id: "comm-2-mno",
        date: "2023-05-15T00:00:00Z",
        type: "Letter",
        subject: "Payment Reminder",
        description: "Sent formal letter regarding late payment pattern",
        outcome: "No response received",
        contactPerson: "Robert Wilson",
        recordedBy: "Jane Doe"
      }
    ]
  }
];

// Generate mock leases based on the mock funds and assets
export const mockLeases: Lease[] = [
  {
    id: "l1-abc-123",
    assetId: "a1b2c3d4-e5f6-4a5b-8c7d-9e8f7a6b5c4d",
    assetName: "Downtown Office Tower",
    tenantId: "t1-abc-123",
    tenantName: "Acme Corporation",
    leaseType: "Office",
    startDate: "2022-01-01T00:00:00Z",
    endDate: "2027-12-31T00:00:00Z",
    baseRent: 45000,
    rentEscalation: 3,
    securityDeposit: 135000,
    leaseArea: 15000,
    status: "Active",
    renewalOptions: [
      {
        id: "r1-abc-123",
        term: 60, // 5 years
        noticeRequired: 12,
        rentIncrease: 10
      }
    ],
    notes: "Premium tenant with excellent payment history",
    createdAt: "2021-11-15T00:00:00Z",
    updatedAt: "2022-01-05T00:00:00Z",
    isIntegratedWithDeals: true,
    isIntegratedWithDocuments: true,
    isIntegratedWithCalendar: true
  },
  {
    id: "l2-def-456",
    assetId: "b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e",
    assetName: "Riverside Apartments",
    tenantId: "t2-def-456",
    tenantName: "Global Retail Inc.",
    leaseType: "Retail",
    startDate: "2021-06-01T00:00:00Z",
    endDate: "2023-12-31T00:00:00Z", // Expiring soon
    baseRent: 28000,
    rentEscalation: 2.5,
    securityDeposit: 84000,
    leaseArea: 8000,
    status: "Active",
    renewalOptions: [
      {
        id: "r2-def-456",
        term: 36, // 3 years
        noticeRequired: 6,
        rentIncrease: 8
      }
    ],
    notes: "Considering expansion to adjacent space",
    createdAt: "2021-05-10T00:00:00Z",
    updatedAt: "2021-06-05T00:00:00Z",
    isIntegratedWithDeals: true,
    isIntegratedWithDocuments: false,
    isIntegratedWithCalendar: true
  },
  {
    id: "l3-ghi-789",
    assetId: "c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f",
    assetName: "Westside Retail Plaza",
    tenantId: "t3-ghi-789",
    tenantName: "Sunshine Cafe",
    leaseType: "Retail",
    startDate: "2020-09-01T00:00:00Z",
    endDate: "2025-08-31T00:00:00Z",
    baseRent: 12000,
    rentEscalation: 2,
    securityDeposit: 36000,
    leaseArea: 3000,
    status: "Active",
    renewalOptions: [
      {
        id: "r3-ghi-789",
        term: 24, // 2 years
        noticeRequired: 3,
        rentIncrease: 5
      }
    ],
    notes: "Requested HVAC improvements",
    createdAt: "2020-08-15T00:00:00Z",
    updatedAt: "2022-03-20T00:00:00Z",
    isIntegratedWithDeals: false,
    isIntegratedWithDocuments: true,
    isIntegratedWithCalendar: true
  },
  {
    id: "l4-jkl-012",
    assetId: "d4e5f6a7-b8c9-7d0e-1f2a-3b4c5d6e7f8a",
    assetName: "Lakefront Industrial Park",
    tenantId: "t4-jkl-012",
    tenantName: "Legal Partners LLP",
    leaseType: "Industrial",
    startDate: "2022-04-01T00:00:00Z",
    endDate: "2024-03-31T00:00:00Z",
    baseRent: 35000,
    rentEscalation: 2.75,
    securityDeposit: 105000,
    leaseArea: 20000,
    status: "Active",
    renewalOptions: [
      {
        id: "r4-jkl-012",
        term: 36, // 3 years
        noticeRequired: 6,
        rentIncrease: 7.5
      }
    ],
    notes: "Negotiating early renewal",
    createdAt: "2022-02-20T00:00:00Z",
    updatedAt: "2022-04-05T00:00:00Z",
    isIntegratedWithDeals: true,
    isIntegratedWithDocuments: true,
    isIntegratedWithCalendar: false,
    dealId: "d1-abc-123"
  },
  {
    id: "l5-mno-345",
    assetId: "e5f6a7b8-c9d0-8e1f-2a3b-4c5d6e7f8a9b",
    assetName: "Midtown Mixed-Use Development",
    tenantId: "t5-mno-345",
    tenantName: "Fitness Evolution",
    leaseType: "Mixed-Use",
    startDate: "2022-07-01T00:00:00Z",
    endDate: "2023-06-30T00:00:00Z", // Expiring very soon
    baseRent: 18000,
    rentEscalation: 3.5,
    securityDeposit: 54000,
    leaseArea: 6000,
    status: "Active",
    renewalOptions: [
      {
        id: "r5-mno-345",
        term: 12, // 1 year
        noticeRequired: 2,
        rentIncrease: 4
      }
    ],
    notes: "Payment issues, monitoring closely",
    createdAt: "2022-06-15T00:00:00Z",
    updatedAt: "2023-01-10T00:00:00Z",
    isIntegratedWithDeals: false,
    isIntegratedWithDocuments: false,
    isIntegratedWithCalendar: false
  },
  {
    id: "l6-pqr-678",
    assetId: "f6a7b8c9-d0e1-9f2a-3b4c-5d6e7f8a9b0c",
    assetName: "Financial District Office",
    tenantId: "t1-abc-123",
    tenantName: "Acme Corporation",
    leaseType: "Office",
    startDate: "2019-01-01T00:00:00Z",
    endDate: "2022-12-31T00:00:00Z", // Recently expired
    baseRent: 65000,
    rentEscalation: 3.25,
    securityDeposit: 195000,
    leaseArea: 25000,
    status: "Expired",
    renewalOptions: [
      {
        id: "r6-pqr-678",
        term: 60, // 5 years
        noticeRequired: 12,
        rentIncrease: 12
      }
    ],
    notes: "Tenant relocated to Downtown Office Tower",
    createdAt: "2018-11-10T00:00:00Z",
    updatedAt: "2023-01-05T00:00:00Z",
    isIntegratedWithDeals: true,
    isIntegratedWithDocuments: true,
    isIntegratedWithCalendar: true,
    dealId: "d2-def-456"
  },
  {
    id: "l7-stu-901",
    assetId: "a7b8c9d0-e1f2-0a3b-4c5d-6e7f8a9b0c1d",
    assetName: "Harbor View Apartments",
    tenantId: "t2-def-456",
    tenantName: "Global Retail Inc.",
    leaseType: "Retail",
    startDate: "2023-09-01T00:00:00Z", // Future lease
    endDate: "2028-08-31T00:00:00Z",
    baseRent: 42000,
    rentEscalation: 2.5,
    securityDeposit: 126000,
    leaseArea: 12000,
    status: "Upcoming",
    renewalOptions: [
      {
        id: "r7-stu-901",
        term: 60, // 5 years
        noticeRequired: 9,
        rentIncrease: 10
      }
    ],
    notes: "New flagship location",
    createdAt: "2023-03-15T00:00:00Z",
    updatedAt: "2023-03-15T00:00:00Z",
    isIntegratedWithDeals: true,
    isIntegratedWithDocuments: true,
    isIntegratedWithCalendar: true
  }
];

// Helper functions
export function getAllLeases(): Lease[] {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Server-side rendering, just return mock leases
    return [...mockLeases];
  }

  // Client-side, combine mock leases with any saved leases from localStorage
  const savedLeases = getSavedLeases();
  return [...mockLeases, ...savedLeases];
}

export function getLeaseById(id: string): Lease | undefined {
  // First check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Server-side rendering, just check mock leases
    return mockLeases.find(lease => lease.id === id);
  }

  // Client-side, check both mock and saved leases
  const allLeases = getAllLeases();
  return allLeases.find(lease => lease.id === id);
}

export function getLeasesByAssetId(assetId: string): Lease[] {
  const allLeases = getAllLeases();
  return allLeases.filter(lease => lease.assetId === assetId);
}

export function getLeasesByTenantId(tenantId: string): Lease[] {
  const allLeases = getAllLeases();
  return allLeases.filter(lease => lease.tenantId === tenantId);
}

export function getAllTenants(): Tenant[] {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Server-side rendering, just return mock tenants
    return [...mockTenants];
  }

  // Client-side, combine mock tenants with any saved tenants from localStorage
  const savedTenants = getSavedTenants();

  // Create a map to store tenants by ID
  const tenantsMap = new Map<string, Tenant>();

  // First add all mock tenants to the map
  mockTenants.forEach(tenant => {
    tenantsMap.set(tenant.id, tenant);
  });

  // Then add all saved tenants to the map (overwriting any mock tenants with the same ID)
  savedTenants.forEach(tenant => {
    tenantsMap.set(tenant.id, tenant);
  });

  // Convert the map values back to an array
  return Array.from(tenantsMap.values());
}

export function getTenantById(id: string): Tenant | undefined {
  // First check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Server-side rendering, just check mock tenants
    return mockTenants.find(tenant => tenant.id === id);
  }

  // Client-side, first check localStorage for the tenant
  const savedTenants = getSavedTenants();
  const savedTenant = savedTenants.find(tenant => tenant.id === id);

  // If found in localStorage, return it
  if (savedTenant) {
    return savedTenant;
  }

  // Otherwise, check the mock tenants
  return mockTenants.find(tenant => tenant.id === id);
}

// Function to save leases to localStorage
export function saveLease(lease: Lease): void {
  if (typeof window === 'undefined') return;

  // Get existing saved leases
  const savedLeases = getSavedLeases();

  // Check if lease already exists (by ID)
  const existingIndex = savedLeases.findIndex(l => l.id === lease.id);

  if (existingIndex >= 0) {
    // Update existing lease
    savedLeases[existingIndex] = lease;
  } else {
    // Add new lease
    savedLeases.push(lease);
  }

  // Save back to localStorage
  localStorage.setItem('savedLeases', JSON.stringify(savedLeases));
}

// Function to get saved leases from localStorage
export function getSavedLeases(): Lease[] {
  if (typeof window === 'undefined') return [];

  const savedLeasesJson = localStorage.getItem('savedLeases');
  if (!savedLeasesJson) return [];

  try {
    return JSON.parse(savedLeasesJson);
  } catch (error) {
    console.error('Error parsing saved leases:', error);
    return [];
  }
}

// Function to save tenants to localStorage
export function saveTenant(tenant: Tenant): void {
  if (typeof window === 'undefined') return;

  // Get existing saved tenants
  const savedTenants = getSavedTenants();

  // Check if tenant already exists (by ID)
  const existingIndex = savedTenants.findIndex(t => t.id === tenant.id);

  if (existingIndex >= 0) {
    // Update existing tenant
    savedTenants[existingIndex] = tenant;
  } else {
    // Add new tenant
    savedTenants.push(tenant);
  }

  // Save back to localStorage
  localStorage.setItem('savedTenants', JSON.stringify(savedTenants));

  // Also update the in-memory mockTenants array
  // This ensures that if the page reloads, it will see the updated data
  const mockTenantIndex = mockTenants.findIndex(t => t.id === tenant.id);
  if (mockTenantIndex >= 0) {
    // Create a deep copy of the tenant to avoid reference issues
    mockTenants[mockTenantIndex] = JSON.parse(JSON.stringify(tenant));
  }

  // Force a refresh of any components that might be using this tenant
  // This is a hack, but it works for our demo purposes
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('tenant-updated', { detail: tenant });
    window.dispatchEvent(event);
  }
}

// Function to get saved tenants from localStorage
export function getSavedTenants(): Tenant[] {
  if (typeof window === 'undefined') return [];

  const savedTenantsJson = localStorage.getItem('savedTenants');
  if (!savedTenantsJson) return [];

  try {
    return JSON.parse(savedTenantsJson);
  } catch (error) {
    console.error('Error parsing saved tenants:', error);
    return [];
  }
}

// Function to delete a lease
export function deleteLease(id: string): void {
  if (typeof window === 'undefined') return;

  // Get existing saved leases
  const savedLeases = getSavedLeases();

  // Filter out the lease to delete
  const updatedLeases = savedLeases.filter(lease => lease.id !== id);

  // Save back to localStorage
  localStorage.setItem('savedLeases', JSON.stringify(updatedLeases));
}

// Function to delete a tenant
export function deleteTenant(id: string): void {
  if (typeof window === 'undefined') return;

  // Get existing saved tenants
  const savedTenants = getSavedTenants();

  // Filter out the tenant to delete
  const updatedTenants = savedTenants.filter(tenant => tenant.id !== id);

  // Save back to localStorage
  localStorage.setItem('savedTenants', JSON.stringify(updatedTenants));
}

// Function to create a new empty lease
export function createEmptyLease(assetId: string, assetName: string, tenantId: string, tenantName: string): Lease {
  // Get global settings
  const globalSettings = getRentRollSettings();

  return {
    id: generateUUID(),
    assetId,
    assetName,
    tenantId,
    tenantName,
    leaseType: 'Office',
    startDate: new Date().toISOString(),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString(), // Default 5-year lease
    baseRent: 0,
    rentEscalation: 3, // Default 3% annual increase
    securityDeposit: 0,
    leaseArea: 0,
    status: 'Upcoming',
    renewalOptions: [],
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    // Integration settings - default to global settings
    isIntegratedWithDeals: globalSettings.integrate_with_deals,
    isIntegratedWithDocuments: globalSettings.integrate_with_documents,
    isIntegratedWithCalendar: globalSettings.integrate_with_calendar
  };
}

// Function to create a new empty tenant
export function createEmptyTenant(name: string): Tenant {
  return {
    id: generateUUID(),
    name,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    industry: '',
    creditRating: '',
    paymentHistory: 'Good',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    // Additional company information
    yearFounded: undefined,
    companySize: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',

    // Financial health indicators
    annualRevenue: undefined,
    profitMargin: undefined,
    debtToEquityRatio: undefined,
    currentRatio: undefined,
    quickRatio: undefined,

    // Satisfaction tracking
    satisfactionRating: undefined,
    satisfactionHistory: [],

    // Communication history
    communicationHistory: [],

    // Custom fields
    customFields: []
  };
}

// Function to update lease status based on dates
export function updateLeaseStatus(lease: Lease): Lease {
  const now = new Date();
  const startDate = new Date(lease.startDate);
  const endDate = new Date(lease.endDate);

  if (now < startDate) {
    lease.status = 'Upcoming';
  } else if (now > endDate) {
    lease.status = 'Expired';
  } else {
    lease.status = 'Active';
  }

  return lease;
}

// Function to calculate monthly rent with escalation for a specific date
export function calculateRentForDate(lease: Lease, date: Date): number {
  const startDate = new Date(lease.startDate);
  const yearsPassed = Math.floor((date.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  if (yearsPassed <= 0) return lease.baseRent;

  // Apply annual escalation
  return lease.baseRent * Math.pow(1 + (lease.rentEscalation / 100), yearsPassed);
}

// Function to calculate rent per square foot
export function calculateRentPerSqFt(lease: Lease): number {
  if (!lease.leaseArea || lease.leaseArea === 0) return 0;
  return (lease.baseRent * 12) / lease.leaseArea; // Annual rent per square foot
}

// Function to get global rent roll settings
export function getRentRollSettings(): {
  integrate_with_deals: boolean;
  integrate_with_documents: boolean;
  integrate_with_calendar: boolean;
} {
  if (typeof window === 'undefined') {
    // Default settings for server-side rendering
    return {
      integrate_with_deals: true,
      integrate_with_documents: true,
      integrate_with_calendar: true
    };
  }

  // Try to get settings from localStorage
  const settingsJson = localStorage.getItem('rentRollSettings');
  if (!settingsJson) {
    // Default settings if none found
    return {
      integrate_with_deals: true,
      integrate_with_documents: true,
      integrate_with_calendar: true
    };
  }

  try {
    return JSON.parse(settingsJson);
  } catch (error) {
    console.error('Error parsing rent roll settings:', error);
    // Return default settings if parsing fails
    return {
      integrate_with_deals: true,
      integrate_with_documents: true,
      integrate_with_calendar: true
    };
  }
}

// Function to update global rent roll settings
export function updateRentRollSettings(settings: {
  integrate_with_deals: boolean;
  integrate_with_documents: boolean;
  integrate_with_calendar: boolean;
}): void {
  if (typeof window === 'undefined') return;

  // Save settings to localStorage
  localStorage.setItem('rentRollSettings', JSON.stringify(settings));
}
