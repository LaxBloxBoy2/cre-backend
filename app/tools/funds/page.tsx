'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs-shadcn';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useToast } from '../../contexts/ToastContext';
import { 
  Plus, Trash2, Edit, Building, MapPin, DollarSign, 
  TrendingUp, BarChart3, Save, X, FileText, 
  PlusCircle, Pencil, ArrowRight
} from 'lucide-react';
import { 
  getAllFunds, getFundById, createEmptyFund, saveFund, deleteFund, 
  createEmptyAsset, addAssetToFund, Fund, FundAsset, generateUUID 
} from '../../lib/mock-funds';

export default function FundsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // State for funds
  const [funds, setFunds] = useState<Fund[]>([]);
  const [selectedFundId, setSelectedFundId] = useState<string | null>(null);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  
  // State for fund creation/editing
  const [isCreatingFund, setIsCreatingFund] = useState(false);
  const [newFundName, setNewFundName] = useState('');
  const [newFundTargetIRR, setNewFundTargetIRR] = useState(12);
  
  // State for asset creation/editing
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetType, setNewAssetType] = useState('Office');
  const [newAssetLocation, setNewAssetLocation] = useState('');
  const [newAssetValue, setNewAssetValue] = useState(0);
  const [newAssetNOI, setNewAssetNOI] = useState(0);
  const [newAssetDebtService, setNewAssetDebtService] = useState(0);
  const [newAssetCapRate, setNewAssetCapRate] = useState(0);
  const [newAssetRequiredCapex, setNewAssetRequiredCapex] = useState(0);
  
  // Load funds on component mount
  useEffect(() => {
    loadFunds();
  }, []);
  
  // Update selected fund when selectedFundId changes
  useEffect(() => {
    if (selectedFundId) {
      const fund = getFundById(selectedFundId);
      setSelectedFund(fund || null);
    } else {
      setSelectedFund(null);
    }
  }, [selectedFundId, funds]);
  
  // Load all funds
  const loadFunds = () => {
    const allFunds = getAllFunds();
    setFunds(allFunds);
    
    // Select the first fund if none is selected
    if (allFunds.length > 0 && !selectedFundId) {
      setSelectedFundId(allFunds[0].id);
    }
  };
  
  // Create a new fund
  const handleCreateFund = () => {
    if (!newFundName.trim()) {
      showToast('Please enter a fund name', 'error');
      return;
    }
    
    const newFund = createEmptyFund(newFundName);
    newFund.targetIRR = newFundTargetIRR / 100; // Convert from percentage to decimal
    
    saveFund(newFund);
    loadFunds();
    setSelectedFundId(newFund.id);
    setIsCreatingFund(false);
    setNewFundName('');
    setNewFundTargetIRR(12);
    
    showToast(`Fund "${newFundName}" created successfully`, 'success');
  };
  
  // Delete a fund
  const handleDeleteFund = (id: string) => {
    if (confirm('Are you sure you want to delete this fund? This action cannot be undone.')) {
      deleteFund(id);
      loadFunds();
      
      if (selectedFundId === id) {
        const remainingFunds = getAllFunds();
        setSelectedFundId(remainingFunds.length > 0 ? remainingFunds[0].id : null);
      }
      
      showToast('Fund deleted successfully', 'success');
    }
  };
  
  // Add a new asset to the selected fund
  const handleAddAsset = () => {
    if (!selectedFund) return;
    
    if (!newAssetName.trim() || !newAssetLocation.trim()) {
      showToast('Please enter asset name and location', 'error');
      return;
    }
    
    // Create new asset
    const newAsset: FundAsset = {
      id: generateUUID(),
      name: newAssetName,
      propertyType: newAssetType,
      location: newAssetLocation,
      value: newAssetValue,
      noi: newAssetNOI,
      debtService: newAssetDebtService,
      capRate: newAssetCapRate / 100, // Convert from percentage to decimal
      requiredCapex: newAssetRequiredCapex,
      lastRefinanceDate: new Date().toISOString(),
      latitude: 0, // Would be set by geocoding in a real app
      longitude: 0 // Would be set by geocoding in a real app
    };
    
    // Add asset to fund
    const updatedFund = addAssetToFund(selectedFund, newAsset);
    
    // Save updated fund
    saveFund(updatedFund);
    loadFunds();
    setIsAddingAsset(false);
    
    // Reset form
    setNewAssetName('');
    setNewAssetType('Office');
    setNewAssetLocation('');
    setNewAssetValue(0);
    setNewAssetNOI(0);
    setNewAssetDebtService(0);
    setNewAssetCapRate(0);
    setNewAssetRequiredCapex(0);
    
    showToast(`Asset "${newAssetName}" added to fund`, 'success');
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format percentage
  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Navigate to fund optimizer
  const handleOptimizeFund = (fundId: string) => {
    router.push(`/tools/fund-optimizer?fundId=${fundId}`);
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Fund Management</h1>
        <Dialog open={isCreatingFund} onOpenChange={setIsCreatingFund}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white">
              <Plus className="mr-2 h-4 w-4" />
              Create New Fund
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Fund</DialogTitle>
              <DialogDescription>
                Enter the details for your new fund.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fund Name</label>
                <Input
                  value={newFundName}
                  onChange={(e) => setNewFundName(e.target.value)}
                  placeholder="Enter fund name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target IRR (%)</label>
                <Input
                  type="number"
                  value={newFundTargetIRR}
                  onChange={(e) => setNewFundTargetIRR(parseFloat(e.target.value))}
                  min={0}
                  max={100}
                  step={0.1}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreatingFund(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateFund}
                className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white"
              >
                Create Fund
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Fund List */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Your Funds</CardTitle>
              <CardDescription>
                Select a fund to manage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {funds.length > 0 ? (
                <div className="space-y-2">
                  {funds.map(fund => (
                    <div 
                      key={fund.id}
                      className={`p-3 rounded-md cursor-pointer flex justify-between items-center ${
                        selectedFundId === fund.id ? 'bg-card-hover border-l-4 border-accent' : 'hover:bg-card-hover'
                      }`}
                      onClick={() => setSelectedFundId(fund.id)}
                    >
                      <div>
                        <p className="font-medium">{fund.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {fund.totalAssets} assets · {formatCurrency(fund.totalValue)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFund(fund.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No funds created yet</p>
                  <Button 
                    onClick={() => setIsCreatingFund(true)}
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Fund
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Fund Details */}
        <div className="md:col-span-3">
          {selectedFund ? (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedFund.name}</CardTitle>
                      <CardDescription>
                        Created on {new Date(selectedFund.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => handleOptimizeFund(selectedFund.id)}
                      className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white"
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Optimize Fund
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-card-hover rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Total Value</p>
                      <p className="text-2xl font-medium">{formatCurrency(selectedFund.totalValue)}</p>
                    </div>
                    <div className="bg-card-hover rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Current IRR</p>
                      <p className="text-2xl font-medium">
                        {selectedFund.currentIRR ? formatPercent(selectedFund.currentIRR) : '0.00%'}
                      </p>
                    </div>
                    <div className="bg-card-hover rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Target IRR</p>
                      <p className="text-2xl font-medium">{formatPercent(selectedFund.targetIRR)}</p>
                    </div>
                  </div>
                  
                  {/* Progress toward target */}
                  {selectedFund.currentIRR > 0 && (
                    <div className="mb-6">
                      <p className="text-sm text-muted-foreground mb-2">Progress Toward Target IRR</p>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div 
                          className="bg-accent h-2.5 rounded-full" 
                          style={{ width: `${Math.min(100, (selectedFund.currentIRR / selectedFund.targetIRR) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0%</span>
                        <span>{formatPercent(selectedFund.targetIRR)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Fund Assets</CardTitle>
                    <Dialog open={isAddingAsset} onOpenChange={setIsAddingAsset}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Asset
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add New Asset</DialogTitle>
                          <DialogDescription>
                            Enter the details for the new asset.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-sm font-medium">Name</label>
                            <Input
                              className="col-span-3"
                              value={newAssetName}
                              onChange={(e) => setNewAssetName(e.target.value)}
                              placeholder="Asset name"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-sm font-medium">Type</label>
                            <Select value={newAssetType} onValueChange={setNewAssetType}>
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select property type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Office">Office</SelectItem>
                                <SelectItem value="Retail">Retail</SelectItem>
                                <SelectItem value="Multifamily">Multifamily</SelectItem>
                                <SelectItem value="Industrial">Industrial</SelectItem>
                                <SelectItem value="Mixed-Use">Mixed-Use</SelectItem>
                                <SelectItem value="Hospitality">Hospitality</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-sm font-medium">Location</label>
                            <Input
                              className="col-span-3"
                              value={newAssetLocation}
                              onChange={(e) => setNewAssetLocation(e.target.value)}
                              placeholder="City, State"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-sm font-medium">Value ($)</label>
                            <Input
                              className="col-span-3"
                              type="number"
                              value={newAssetValue}
                              onChange={(e) => setNewAssetValue(parseFloat(e.target.value))}
                              min={0}
                              step={1000}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-sm font-medium">NOI ($)</label>
                            <Input
                              className="col-span-3"
                              type="number"
                              value={newAssetNOI}
                              onChange={(e) => setNewAssetNOI(parseFloat(e.target.value))}
                              min={0}
                              step={1000}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-sm font-medium">Debt Service ($)</label>
                            <Input
                              className="col-span-3"
                              type="number"
                              value={newAssetDebtService}
                              onChange={(e) => setNewAssetDebtService(parseFloat(e.target.value))}
                              min={0}
                              step={1000}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-sm font-medium">Cap Rate (%)</label>
                            <Input
                              className="col-span-3"
                              type="number"
                              value={newAssetCapRate}
                              onChange={(e) => setNewAssetCapRate(parseFloat(e.target.value))}
                              min={0}
                              max={100}
                              step={0.1}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-sm font-medium">Required CapEx ($)</label>
                            <Input
                              className="col-span-3"
                              type="number"
                              value={newAssetRequiredCapex}
                              onChange={(e) => setNewAssetRequiredCapex(parseFloat(e.target.value))}
                              min={0}
                              step={1000}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddingAsset(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleAddAsset}
                            className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white"
                          >
                            Add Asset
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedFund.assets.length > 0 ? (
                    <div className="space-y-4">
                      {selectedFund.assets.map(asset => (
                        <div key={asset.id} className="bg-card-hover rounded-lg p-4 border border-border">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{asset.name}</h3>
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span>{asset.location}</span>
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Building className="h-3 w-3 mr-1" />
                                <span>{asset.propertyType}</span>
                              </div>
                            </div>
                            <Badge variant="outline">
                              Cap Rate: {formatPercent(asset.capRate)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Value</p>
                              <p className="font-medium">{formatCurrency(asset.value)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">NOI</p>
                              <p className="font-medium">{formatCurrency(asset.noi)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Debt Service</p>
                              <p className="font-medium">{formatCurrency(asset.debtService)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Required CapEx</p>
                              <p className="font-medium">{formatCurrency(asset.requiredCapex)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No assets in this fund yet</p>
                      <Button 
                        onClick={() => setIsAddingAsset(true)}
                        variant="outline"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Asset
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-center mb-6 text-muted-foreground">
                  Select a fund from the list or create a new one to get started.
                </p>
                <Button 
                  onClick={() => setIsCreatingFund(true)}
                  className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Fund
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
