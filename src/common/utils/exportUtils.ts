/**
 * Utility function to export data to CSV or JSON with proper UTF-8 BOM encoding for Excel.
 */

export interface ExportColumnDef {
  id: string;
  label: string;
  accessor?: (row: any) => any;
}

export function downloadDataExport(
  data: any[],
  columns: ExportColumnDef[],
  filenamePrefix: string,
  format: 'csv' | 'json' = 'csv'
) {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${filenamePrefix}_${timestamp}.${format}`;

  if (format === 'json') {
    const jsonRows = data.map(row => {
      const formatted: Record<string, any> = {};
      columns.forEach(col => {
        formatted[col.label] = col.accessor ? col.accessor(row) : row[col.id] ?? '';
      });
      return formatted;
    });

    const jsonString = JSON.stringify(jsonRows, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    triggerBlobDownload(blob, filename);
    return;
  }

  // CSV Format
  const escapeCsvCell = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val).trim();
    // Escape quotes if needed or if comma/newline present
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = columns.map(col => escapeCsvCell(col.label)).join(',');
  const rows = data.map(row => {
    return columns
      .map(col => {
        const value = col.accessor ? col.accessor(row) : row[col.id] ?? '';
        return escapeCsvCell(value);
      })
      .join(',');
  });

  // Prepend UTF-8 BOM (\uFEFF) so Excel opens UTF-8 characters properly
  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerBlobDownload(blob, filename);
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
