// Mock fund data for development
export interface Fund {
  id: string;
  name: string;
  totalAssets: number;
  currentIRR: number;
  targetIRR: number;
  totalValue: number;
  createdAt: string;
  assets: FundAsset[];
}

export interface FundAsset {
  id: string;
  name: string;
  propertyType: string;
  location: string;
  value: number;
  noi: number;
  debtService: number;
  capRate: number;
  requiredCapex: number;
  lastRefinanceDate: string;
  latitude: number;
  longitude: number;
}

export const mockFunds: Fund[] = [
  {
    id: "f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
    name: "Diversified Growth Fund I",
    totalAssets: 5,
    currentIRR: 0.112,
    targetIRR: 0.15,
    totalValue: 45000000,
    createdAt: "2022-03-15T00:00:00Z",
    assets: [
      {
        id: "a1b2c3d4-e5f6-4a5b-8c7d-9e8f7a6b5c4d",
        name: "Downtown Office Tower",
        propertyType: "Office",
        location: "New York, NY",
        value: 12000000,
        noi: 720000,
        debtService: 540000,
        capRate: 0.06,
        requiredCapex: 150000,
        lastRefinanceDate: "2021-06-10T00:00:00Z",
        latitude: 40.7128,
        longitude: -74.0060
      },
      {
        id: "b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e",
        name: "Riverside Apartments",
        propertyType: "Multifamily",
        location: "Austin, TX",
        value: 8500000,
        noi: 595000,
        debtService: 425000,
        capRate: 0.07,
        requiredCapex: 75000,
        lastRefinanceDate: "2022-01-15T00:00:00Z",
        latitude: 30.2672,
        longitude: -97.7431
      },
      {
        id: "c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f",
        name: "Westside Retail Plaza",
        propertyType: "Retail",
        location: "Chicago, IL",
        value: 9500000,
        noi: 665000,
        debtService: 475000,
        capRate: 0.07,
        requiredCapex: 120000,
        lastRefinanceDate: "2021-09-22T00:00:00Z",
        latitude: 41.8781,
        longitude: -87.6298
      },
      {
        id: "d4e5f6a7-b8c9-7d0e-1f2a-3b4c5d6e7f8a",
        name: "Lakefront Industrial Park",
        propertyType: "Industrial",
        location: "Cleveland, OH",
        value: 7000000,
        noi: 560000,
        debtService: 350000,
        capRate: 0.08,
        requiredCapex: 50000,
        lastRefinanceDate: "2022-03-05T00:00:00Z",
        latitude: 41.4993,
        longitude: -81.6944
      },
      {
        id: "e5f6a7b8-c9d0-8e1f-2a3b-4c5d6e7f8a9b",
        name: "Midtown Mixed-Use Development",
        propertyType: "Mixed-Use",
        location: "Atlanta, GA",
        value: 8000000,
        noi: 520000,
        debtService: 400000,
        capRate: 0.065,
        requiredCapex: 200000,
        lastRefinanceDate: "2021-11-30T00:00:00Z",
        latitude: 33.7490,
        longitude: -84.3880
      }
    ]
  },
  {
    id: "a7b8c9d0-e1f2-4a3b-8c5d-6e7f8a9b0c1d",
    name: "Urban Core Opportunity Fund",
    totalAssets: 3,
    currentIRR: 0.095,
    targetIRR: 0.14,
    totalValue: 28000000,
    createdAt: "2022-07-20T00:00:00Z",
    assets: [
      {
        id: "f6a7b8c9-d0e1-9f2a-3b4c-5d6e7f8a9b0c",
        name: "Financial District Office",
        propertyType: "Office",
        location: "San Francisco, CA",
        value: 14000000,
        noi: 840000,
        debtService: 700000,
        capRate: 0.06,
        requiredCapex: 250000,
        lastRefinanceDate: "2022-02-18T00:00:00Z",
        latitude: 37.7749,
        longitude: -122.4194
      },
      {
        id: "a7b8c9d0-e1f2-0a3b-4c5d-6e7f8a9b0c1d",
        name: "Harbor View Apartments",
        propertyType: "Multifamily",
        location: "Seattle, WA",
        value: 9000000,
        noi: 630000,
        debtService: 450000,
        capRate: 0.07,
        requiredCapex: 100000,
        lastRefinanceDate: "2022-05-10T00:00:00Z",
        latitude: 47.6062,
        longitude: -122.3321
      },
      {
        id: "b8c9d0e1-f2a3-1b4c-5d6e-7f8a9b0c1d2e",
        name: "Downtown Retail Center",
        propertyType: "Retail",
        location: "Boston, MA",
        value: 5000000,
        noi: 350000,
        debtService: 250000,
        capRate: 0.07,
        requiredCapex: 80000,
        lastRefinanceDate: "2021-12-05T00:00:00Z",
        latitude: 42.3601,
        longitude: -71.0589
      }
    ]
  },
  {
    id: "b8c9d0e1-f2a3-4b5c-9d6e-7f8a9b0c1d2e",
    name: "Sunbelt Growth Fund II",
    totalAssets: 4,
    currentIRR: 0.132,
    targetIRR: 0.16,
    totalValue: 32000000,
    createdAt: "2021-11-05T00:00:00Z",
    assets: [
      {
        id: "c9d0e1f2-a3b4-2c5d-6e7f-8a9b0c1d2e3f",
        name: "Tech Corridor Office Park",
        propertyType: "Office",
        location: "Raleigh, NC",
        value: 7500000,
        noi: 525000,
        debtService: 375000,
        capRate: 0.07,
        requiredCapex: 100000,
        lastRefinanceDate: "2021-08-15T00:00:00Z",
        latitude: 35.7796,
        longitude: -78.6382
      },
      {
        id: "d0e1f2a3-b4c5-3d6e-7f8a-9b0c1d2e3f4a",
        name: "Suburban Garden Apartments",
        propertyType: "Multifamily",
        location: "Phoenix, AZ",
        value: 11000000,
        noi: 770000,
        debtService: 550000,
        capRate: 0.07,
        requiredCapex: 150000,
        lastRefinanceDate: "2022-01-20T00:00:00Z",
        latitude: 33.4484,
        longitude: -112.0740
      },
      {
        id: "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
        name: "Beachside Retail Strip",
        propertyType: "Retail",
        location: "Tampa, FL",
        value: 6500000,
        noi: 455000,
        debtService: 325000,
        capRate: 0.07,
        requiredCapex: 90000,
        lastRefinanceDate: "2021-10-10T00:00:00Z",
        latitude: 27.9506,
        longitude: -82.4572
      },
      {
        id: "f2a3b4c5-d6e7-5f8a-9b0c-1d2e3f4a5b6c",
        name: "Logistics Center",
        propertyType: "Industrial",
        location: "Dallas, TX",
        value: 7000000,
        noi: 560000,
        debtService: 350000,
        capRate: 0.08,
        requiredCapex: 60000,
        lastRefinanceDate: "2022-02-28T00:00:00Z",
        latitude: 32.7767,
        longitude: -96.7970
      }
    ]
  }
];

// Function to get a fund by ID
export function getFundById(id: string): Fund | undefined {
  // First check localStorage for any saved funds
  const savedFunds = getSavedFunds();
  const allFunds = [...mockFunds, ...savedFunds];
  return allFunds.find(fund => fund.id === id);
}

// Function to get all funds
export function getAllFunds(): Fund[] {
  // Combine mock funds with any saved funds from localStorage
  const savedFunds = getSavedFunds();
  return [...mockFunds, ...savedFunds];
}

// Function to generate a UUID
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Function to save funds to localStorage
export function saveFund(fund: Fund): void {
  if (typeof window === 'undefined') return;

  // Get existing saved funds
  const savedFunds = getSavedFunds();

  // Check if fund already exists (by ID)
  const existingIndex = savedFunds.findIndex(f => f.id === fund.id);

  if (existingIndex >= 0) {
    // Update existing fund
    savedFunds[existingIndex] = fund;
  } else {
    // Add new fund
    savedFunds.push(fund);
  }

  // Save back to localStorage
  localStorage.setItem('savedFunds', JSON.stringify(savedFunds));
}

// Function to get saved funds from localStorage
export function getSavedFunds(): Fund[] {
  if (typeof window === 'undefined') return [];

  const savedFundsJson = localStorage.getItem('savedFunds');
  if (!savedFundsJson) return [];

  try {
    return JSON.parse(savedFundsJson);
  } catch (error) {
    console.error('Error parsing saved funds:', error);
    return [];
  }
}

// Function to delete a fund
export function deleteFund(id: string): void {
  if (typeof window === 'undefined') return;

  // Get existing saved funds
  const savedFunds = getSavedFunds();

  // Filter out the fund to delete
  const updatedFunds = savedFunds.filter(fund => fund.id !== id);

  // Save back to localStorage
  localStorage.setItem('savedFunds', JSON.stringify(updatedFunds));
}

// Function to create a new empty fund
export function createEmptyFund(name: string): Fund {
  return {
    id: generateUUID(),
    name,
    totalAssets: 0,
    currentIRR: 0,
    targetIRR: 0.12, // Default target IRR of 12%
    totalValue: 0,
    createdAt: new Date().toISOString(),
    assets: []
  };
}

// Function to add an asset to a fund
export function addAssetToFund(fund: Fund, asset: FundAsset): Fund {
  // Create a copy of the fund
  const updatedFund = { ...fund };

  // Add the asset
  updatedFund.assets = [...updatedFund.assets, asset];

  // Update fund metrics
  updatedFund.totalAssets = updatedFund.assets.length;
  updatedFund.totalValue = updatedFund.assets.reduce((sum, asset) => sum + asset.value, 0);

  // Calculate current IRR (simplified calculation for demo)
  const totalNOI = updatedFund.assets.reduce((sum, asset) => sum + asset.noi, 0);
  updatedFund.currentIRR = totalNOI / updatedFund.totalValue;

  return updatedFund;
}

// Function to create a new empty asset
export function createEmptyAsset(name: string, propertyType: string, location: string): FundAsset {
  return {
    id: generateUUID(),
    name,
    propertyType,
    location,
    value: 0,
    noi: 0,
    debtService: 0,
    capRate: 0,
    requiredCapex: 0,
    lastRefinanceDate: new Date().toISOString(),
    latitude: 0,
    longitude: 0
  };
}
