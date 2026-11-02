import React from 'react';
import { Download } from 'lucide-react';
import { exportToCSV } from '../../utils/formatters';

interface ExportButtonProps<T extends Record<string, any>> {
  data: T[];
  filename: string;
  columns?: { key: keyof T; label: string }[];
  label?: string;
  disabled?: boolean;
}

export const ExportButton = <T extends Record<string, any>>({
  data,
  filename,
  columns,
  label = 'Export CSV',
  disabled = false,
}: ExportButtonProps<T>) => {
  const handleExport = () => {
    exportToCSV(data, filename, columns);
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || data.length === 0}
      title={data.length === 0 ? 'No records to export' : `Export ${data.length} real record(s) to CSV`}
      className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium border border-slate-200 bg-white text-slate-700 shadow-2xs transition-colors cursor-pointer group ${
        disabled || data.length === 0
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
      }`}
    >
      <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
      <span>{label}</span>
      {data.length > 0 && (
        <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums bg-slate-100 text-slate-600">
          {data.length}
        </span>
      )}
    </button>
  );
};
