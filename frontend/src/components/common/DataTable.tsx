import React, { useState, useMemo } from 'react';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import {
  LucideIcon,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Search,
} from 'lucide-react';
import { Button } from './Button';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  sortable?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyActionText?: string;
  onEmptyAction?: () => void;
  onRowClick?: (item: T) => void;
  rowKey: (item: T) => string;
  enablePagination?: boolean;
  pageSizeDefault?: number;
  exportFileName?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There is no data available to display right now.',
  emptyIcon,
  emptyActionText,
  onEmptyAction,
  onRowClick,
  rowKey,
  enablePagination = true,
  pageSizeDefault = 10,
  exportFileName,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(pageSizeDefault);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a: any, b: any) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [data, sortKey, sortDirection]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    if (!enablePagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, enablePagination]);

  const exportCSV = () => {
    if (data.length === 0) return;
    const headerRow = columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');
    const rows = data.map((item: any) =>
      columns
        .map((c) => {
          const val = item[c.key] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headerRow, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${exportFileName || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="bg-surface rounded-xl sm:rounded-2xl border border-border overflow-hidden p-6 space-y-4 shadow-soft">
        <Skeleton className="h-6 w-1/4" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-surface rounded-xl sm:rounded-2xl border border-border overflow-hidden p-6 shadow-soft">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={emptyIcon}
          actionText={emptyActionText}
          onAction={onEmptyAction}
        />
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl sm:rounded-2xl border border-border shadow-soft hover:shadow-elevated hover:border-border/90 transition-all duration-200 overflow-hidden">
      {/* Top Table Actions Bar if exportable */}
      {exportFileName && (
        <div className="px-5 py-3 border-b border-border flex items-center justify-between text-xs bg-surface">
          <span className="text-secondary font-medium">
            Showing <strong className="text-ink">{paginatedData.length}</strong> of{' '}
            <strong className="text-ink">{data.length}</strong> records
          </span>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg sm:rounded-xl border border-border text-secondary hover:text-accent hover:bg-accent-muted hover:border-accent/40 font-semibold transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm border-collapse">

          <thead>
            <tr className="border-b border-border bg-surface-raised text-secondary">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                    className={`px-5 py-3.5 font-semibold text-xs uppercase tracking-wider select-none ${
                      col.sortable !== false ? 'cursor-pointer hover:text-accent transition-colors' : ''
                    } ${col.className || ''}`}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable !== false && (
                        <span className="text-muted">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-accent" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-accent" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData.map((item, index) => (
              <tr
                key={rowKey(item)}
                onClick={() => onRowClick && onRowClick(item)}
                className={`transition-colors hover:bg-surface-raised ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-5 py-4 text-ink font-normal ${col.className || ''}`}
                  >
                    {col.render ? col.render(item, index) : (item as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {enablePagination && totalPages > 1 && (
        <div className="px-5 py-3.5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-surface-raised">
          <div className="flex items-center gap-2 text-secondary">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 rounded-lg border border-border bg-surface text-ink px-2 text-xs font-semibold focus:outline-none focus:border-accent cursor-pointer hover:border-accent"
            >
              {[5, 10, 20, 50].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-secondary mr-2">
              Page <strong className="text-ink">{currentPage}</strong> of{' '}
              <strong className="text-ink">{totalPages}</strong>
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-border text-secondary hover:text-accent hover:bg-accent-muted hover:border-accent/40 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pNum = i + 1;
              return (
                <button
                  key={pNum}
                  onClick={() => setCurrentPage(pNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === pNum
                      ? 'bg-accent text-white shadow-xs'
                      : 'border border-border text-secondary hover:text-accent hover:bg-accent-muted hover:border-accent/40'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-border text-secondary hover:text-accent hover:bg-accent-muted hover:border-accent/40 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
