'use client';

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs-shadcn';
import { Button } from '../ui/button';
import { PlusIcon, TrashIcon, DownloadIcon, ArrowRightIcon, FileIcon, BookmarkIcon, Pencil1Icon } from '@radix-ui/react-icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { UnderwritingScenario } from '../../types/underwriting';
import { formatDate } from '../../lib/utils/date';

interface ScenarioSelectorProps {
  scenarios: UnderwritingScenario[];
  selectedScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  onCreateScenario: (name: string, description: string) => void;
  onDeleteScenario: (scenarioId: string) => void;
  onUpdateScenario?: (scenarioId: string, data: Partial<UnderwritingScenario>) => void;
  onExportToExcel: (scenarioId: string) => void;
  onExportToPDF?: (scenarioId: string) => void;
  onSaveToDeal?: (scenarioId: string) => void;
  onCompareScenarios: (baseScenarioId: string, compareScenarioId: string) => void;
  isLoading?: boolean;
}

export default function ScenarioSelector({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  onCreateScenario,
  onDeleteScenario,
  onUpdateScenario,
  onExportToExcel,
  onExportToPDF,
  onSaveToDeal,
  onCompareScenarios,
  isLoading = false
}: ScenarioSelectorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioDescription, setNewScenarioDescription] = useState('');
  const [scenarioToDelete, setScenarioToDelete] = useState<string | null>(null);
  const [scenarioToRename, setScenarioToRename] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [compareScenarioId, setCompareScenarioId] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<string>('excel');
  const [exportOptions, setExportOptions] = useState({
    includeCharts: true,
    includeAssumptions: true,
    includeResults: true,
    includeCashFlows: true
  });

  const handleCreateScenario = () => {
    if (newScenarioName.trim()) {
      onCreateScenario(newScenarioName, newScenarioDescription);
      setNewScenarioName('');
      setNewScenarioDescription('');
      setIsCreateDialogOpen(false);
    }
  };

  const handleDeleteScenario = () => {
    if (scenarioToDelete) {
      onDeleteScenario(scenarioToDelete);
      setScenarioToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleRenameScenario = () => {
    if (scenarioToRename && renameValue.trim() && onUpdateScenario) {
      onUpdateScenario(scenarioToRename, { label: renameValue.trim() });
      setScenarioToRename(null);
      setRenameValue('');
      setIsRenameDialogOpen(false);
    }
  };

  const handleCompareScenarios = () => {
    if (compareScenarioId) {
      onCompareScenarios(selectedScenarioId, compareScenarioId);
      setCompareScenarioId('');
      setIsCompareDialogOpen(false);
    }
  };

  const handleExport = () => {
    if (exportFormat === 'excel') {
      onExportToExcel(selectedScenarioId);
    } else if (exportFormat === 'pdf' && onExportToPDF) {
      onExportToPDF(selectedScenarioId);
    }
    setIsExportDialogOpen(false);
  };

  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Scenarios</h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCompareDialogOpen(true)}
            disabled={scenarios.length < 2 || isLoading}
            className="text-xs"
          >
            <ArrowRightIcon className="mr-1 h-3 w-3" />
            Compare
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setExportFormat('excel');
              setIsExportDialogOpen(true);
            }}
            disabled={!selectedScenarioId || isLoading}
            className="text-xs"
          >
            <DownloadIcon className="mr-1 h-3 w-3" />
            Export
          </Button>

          {onSaveToDeal && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSaveToDeal(selectedScenarioId)}
              disabled={!selectedScenarioId || isLoading}
              className="text-xs"
            >
              <BookmarkIcon className="mr-1 h-3 w-3" />
              Save
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const selectedScenario = scenarios.find(s => s.id === selectedScenarioId);
              if (selectedScenario && onUpdateScenario) {
                setScenarioToRename(selectedScenarioId);
                setRenameValue(selectedScenario.label);
                setIsRenameDialogOpen(true);
              }
            }}
            disabled={!selectedScenarioId || isLoading || !onUpdateScenario}
            className="text-xs"
          >
            <Pencil1Icon className="mr-1 h-3 w-3" />
            Rename
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setScenarioToDelete(selectedScenarioId);
              setIsDeleteDialogOpen(true);
            }}
            disabled={!selectedScenarioId || isLoading || scenarios.length <= 1}
            className="text-xs"
          >
            <TrashIcon className="mr-1 h-3 w-3" />
            Delete
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateDialogOpen(true)}
            disabled={isLoading}
            className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white text-xs"
          >
            <PlusIcon className="mr-1 h-3 w-3" />
            New
          </Button>
        </div>
      </div>

      <Tabs
        value={selectedScenarioId}
        onValueChange={onSelectScenario}
        className="w-full"
      >
        <TabsList className="w-full" style={{ backgroundColor: 'var(--bg-card-hover-darker)' }}>
          {scenarios.map((scenario) => (
            <TabsTrigger
              key={scenario.id}
              value={scenario.id}
              className="flex-1"
              style={{
                color: selectedScenarioId === scenario.id ? 'var(--accent)' : 'var(--text-primary-darker)',
                fontWeight: 600
              }}
            >
              {scenario.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {selectedScenario && (
        <div className="p-3 rounded-md text-sm" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            {selectedScenario.description || 'No description provided'}
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Created by {selectedScenario.created_by} on {formatDate(selectedScenario.created_at)}
            {selectedScenario.modified_at && ` • Last modified on ${formatDate(selectedScenario.modified_at)}`}
          </p>
        </div>
      )}

      {/* Create Scenario Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-dark)',
          color: 'var(--text-primary)'
        }}>
          <DialogHeader>
            <DialogTitle>Create New Scenario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scenario-name">Scenario Name</Label>
              <Input
                id="scenario-name"
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                placeholder="e.g., Base Case, Optimistic Case"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenario-description">Description (Optional)</Label>
              <Textarea
                id="scenario-description"
                value={newScenarioDescription}
                onChange={(e) => setNewScenarioDescription(e.target.value)}
                placeholder="Describe the assumptions or purpose of this scenario"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateScenario}
              disabled={!newScenarioName.trim()}
              className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white"
            >
              Create Scenario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Scenario Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-dark)',
          color: 'var(--text-primary)'
        }}>
          <DialogHeader>
            <DialogTitle>Delete Scenario</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p style={{ color: 'var(--text-muted)' }}>
              Are you sure you want to delete this scenario? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteScenario}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Scenario Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-dark)',
          color: 'var(--text-primary)'
        }}>
          <DialogHeader>
            <DialogTitle>Rename Scenario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-scenario">Scenario Name</Label>
              <Input
                id="rename-scenario"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Enter new scenario name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameScenario}
              disabled={!renameValue.trim()}
              className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compare Scenarios Dialog */}
      <Dialog open={isCompareDialogOpen} onOpenChange={setIsCompareDialogOpen}>
        <DialogContent style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-dark)',
          color: 'var(--text-primary)'
        }}>
          <DialogHeader>
            <DialogTitle>Compare Scenarios</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="base-scenario">Base Scenario</Label>
              <Input
                id="base-scenario"
                value={selectedScenario?.label || ''}
                disabled
                className="bg-dark-card-hover"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compare-scenario">Compare With</Label>
              <select
                id="compare-scenario"
                value={compareScenarioId}
                onChange={(e) => setCompareScenarioId(e.target.value)}
                className="flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--bg-card-hover)',
                  borderColor: 'var(--border-dark)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">Select a scenario</option>
                {scenarios
                  .filter(s => s.id !== selectedScenarioId)
                  .map(scenario => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.label}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCompareDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompareScenarios}
              disabled={!compareScenarioId}
              className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white"
            >
              Compare
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-dark)',
          color: 'var(--text-primary)'
        }}>
          <DialogHeader>
            <DialogTitle>Export Scenario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="export-format">Export Format</Label>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="format-excel"
                    name="export-format"
                    value="excel"
                    checked={exportFormat === 'excel'}
                    onChange={() => setExportFormat('excel')}
                    className="mr-2"
                  />
                  <Label htmlFor="format-excel">Excel</Label>
                </div>
                {onExportToPDF && (
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="format-pdf"
                      name="export-format"
                      value="pdf"
                      checked={exportFormat === 'pdf'}
                      onChange={() => setExportFormat('pdf')}
                      className="mr-2"
                    />
                    <Label htmlFor="format-pdf">PDF</Label>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Export Options</Label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="include-assumptions"
                    checked={exportOptions.includeAssumptions}
                    onChange={(e) => setExportOptions({...exportOptions, includeAssumptions: e.target.checked})}
                    className="mr-2"
                  />
                  <Label htmlFor="include-assumptions">Include Assumptions</Label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="include-results"
                    checked={exportOptions.includeResults}
                    onChange={(e) => setExportOptions({...exportOptions, includeResults: e.target.checked})}
                    className="mr-2"
                  />
                  <Label htmlFor="include-results">Include Results</Label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="include-cash-flows"
                    checked={exportOptions.includeCashFlows}
                    onChange={(e) => setExportOptions({...exportOptions, includeCashFlows: e.target.checked})}
                    className="mr-2"
                  />
                  <Label htmlFor="include-cash-flows">Include Cash Flows</Label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="include-charts"
                    checked={exportOptions.includeCharts}
                    onChange={(e) => setExportOptions({...exportOptions, includeCharts: e.target.checked})}
                    className="mr-2"
                  />
                  <Label htmlFor="include-charts">Include Charts</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              className="bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white"
            >
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
