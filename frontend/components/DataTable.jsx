import { useState } from 'react';
import { RefreshCw, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataTable({ data = [], loading = false, onRefresh, title = 'Data Table' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 1. Dynamic Columns Detection (Excluding sensitive fields or custom id if needed)
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  // Helper to format table headers
  const formatHeader = (header) => {
    return header
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Helper to format values elegantly
  const formatCell = (value, column) => {
    if (value === null || value === undefined) return <span className="text-slate-600">-</span>;
    if (typeof value === 'boolean') {
      return value ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">True</span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">False</span>
      );
    }
    // Date formatting (regex for simple ISO or YYYY-MM-DD checks)
    if (column.toLowerCase().includes('date') || column.toLowerCase().includes('time')) {
      try {
        const dateObj = new Date(value);
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        }
      } catch (e) {
        // Fallback to plain string if error
      }
    }
    // Price / currency formatting
    if (column.toLowerCase().includes('price') || column.toLowerCase().includes('value') || column.toLowerCase().includes('cost')) {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        return `$${numValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }
    // Status formatting
    if (column.toLowerCase() === 'status') {
      const valStr = String(value);
      const isSuccess = ['active', 'success', 'paid', 'completed', 'delivered'].includes(valStr.toLowerCase());
      const isWarning = ['on leave', 'pending', 'hold', 'progress'].includes(valStr.toLowerCase());
      
      if (isSuccess) {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            {valStr}
          </span>
        );
      } else if (isWarning) {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/25">
            {valStr}
          </span>
        );
      } else {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {valStr}
          </span>
        );
      }
    }

    return String(value);
  };

  // Sorting Handler
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 2. Filter data by search
  const filteredData = data.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // 3. Sort filtered data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const key = sortConfig.key;
    const aValue = a[key];
    const bValue = b[key];

    if (aValue === bValue) return 0;
    
    // Support numeric comparisons
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // Text comparisons
    const strA = String(aValue).toLowerCase();
    const strB = String(bValue).toLowerCase();
    return sortConfig.direction === 'asc'
      ? strA.localeCompare(strB)
      : strB.localeCompare(strA);
  });

  // 4. Paginate data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Table Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-wide">{title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Found {filteredData.length} records</p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative flex-grow sm:flex-grow-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search dataset..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900/50 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-64 transition-all"
            />
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <p className="text-xs text-slate-400">Loading dataset from secure query...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <p className="text-sm font-medium text-slate-400">No data records found</p>
              <p className="text-xs text-slate-500 mt-1">This table might be empty in the PostgreSQL database.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800">
                  {columns.map((column) => (
                    <th
                      key={column}
                      onClick={() => handleSort(column)}
                      className="px-6 py-3.5 text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-850 hover:text-white transition-all select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        {formatHeader(column)}
                        <ArrowUpDown size={12} className="text-slate-500" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedData.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    className="hover:bg-slate-900/30 transition-colors duration-150"
                  >
                    {columns.map((column) => (
                      <td key={column} className="px-6 py-3.5 text-xs text-slate-300 font-normal">
                        {formatCell(row[column], column)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Panel */}
        {!loading && data.length > 0 && (
          <div className="px-6 py-3 bg-slate-900/40 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Showing <span className="font-semibold text-slate-200">{Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredData.length, currentPage * itemsPerPage)}</span> of <span className="font-semibold text-slate-200">{filteredData.length}</span> entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 rounded bg-slate-900 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-slate-300 px-2">
                Page <span className="font-semibold text-white">{currentPage}</span> of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 rounded bg-slate-900 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
