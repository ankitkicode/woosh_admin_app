import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Download, CheckSquare, Square, FileSpreadsheet, FileJson, Check, AlertCircle, RefreshCw } from 'lucide-react';

export interface ExportColumn {
  id: string;
  label: string;
  defaultSelected?: boolean;
  category?: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  columns: ExportColumn[];
  totalRecords: number;
  currentPageCount: number;
  onExport: (selectedColumnIds: string[], scope: 'current' | 'all', format: 'csv' | 'json') => Promise<void>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  title,
  description = 'Select columns to include in your export file and choose format.',
  columns,
  totalRecords,
  currentPageCount,
  onExport,
}) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() =>
    columns.filter(c => c.defaultSelected !== false).map(c => c.id)
  );
  const [scope, setScope] = useState<'current' | 'all'>('all');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleColumn = (id: string) => {
    setSelectedColumns(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedColumns(columns.map(c => c.id));
  };

  const deselectAll = () => {
    setSelectedColumns([]);
  };

  const handleDownload = async () => {
    if (selectedColumns.length === 0) {
      setError('Please select at least one column to export.');
      return;
    }
    setError(null);
    setIsExporting(true);
    try {
      await onExport(selectedColumns, scope, format);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Group columns by category if available
  const categories = Array.from(new Set(columns.map(c => c.category || 'Standard Information')));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-woosh-muted">
            <span className="font-semibold text-woosh-dark">{selectedColumns.length}</span> of {columns.length} columns selected
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={isExporting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              disabled={isExporting || selectedColumns.length === 0}
              className="bg-woosh-primary text-white"
            >
              {isExporting ? (
                <>
                  <RefreshCw size={14} className="animate-spin mr-1.5" />
                  Generating Export...
                </>
              ) : (
                <>
                  <Download size={14} className="mr-1.5" />
                  Download {format.toUpperCase()} ({scope === 'all' ? `${totalRecords} records` : `${currentPageCount} records`})
                </>
              )}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Export Scope and Format Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
          {/* Scope */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Data Scope
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  scope === 'all'
                    ? 'bg-white border-woosh-primary text-woosh-primary shadow-sm font-bold'
                    : 'bg-transparent border-gray-200 text-gray-600 hover:bg-white'
                }`}
              >
                All Filtered ({totalRecords})
              </button>
              <button
                type="button"
                onClick={() => setScope('current')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  scope === 'current'
                    ? 'bg-white border-woosh-primary text-woosh-primary shadow-sm font-bold'
                    : 'bg-transparent border-gray-200 text-gray-600 hover:bg-white'
                }`}
              >
                Current Page ({currentPageCount})
              </button>
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              File Format
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  format === 'csv'
                    ? 'bg-white border-woosh-primary text-woosh-primary shadow-sm font-bold'
                    : 'bg-transparent border-gray-200 text-gray-600 hover:bg-white'
                }`}
              >
                <FileSpreadsheet size={14} />
                CSV (Excel)
              </button>
              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  format === 'json'
                    ? 'bg-white border-woosh-primary text-woosh-primary shadow-sm font-bold'
                    : 'bg-transparent border-gray-200 text-gray-600 hover:bg-white'
                }`}
              >
                <FileJson size={14} />
                JSON
              </button>
            </div>
          </div>
        </div>

        {/* Quick select buttons */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-woosh-dark">
            Columns to Include
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-woosh-primary hover:underline font-semibold flex items-center gap-1"
            >
              <CheckSquare size={13} /> Select All
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={deselectAll}
              className="text-xs text-gray-500 hover:text-gray-700 font-semibold flex items-center gap-1"
            >
              <Square size={13} /> Deselect All
            </button>
          </div>
        </div>

        {/* Column Checkboxes grouped by category */}
        <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
          {categories.map(category => {
            const catCols = columns.filter(c => (c.category || 'Standard Information') === category);
            return (
              <div key={category} className="space-y-2">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {category}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {catCols.map(col => {
                    const isSelected = selectedColumns.includes(col.id);
                    return (
                      <div
                        key={col.id}
                        onClick={() => toggleColumn(col.id)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all select-none ${
                          isSelected
                            ? 'bg-woosh-primary/5 border-woosh-primary text-woosh-dark'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                            isSelected
                              ? 'bg-woosh-primary border-woosh-primary text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span className="truncate">{col.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
