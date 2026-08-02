import { flexRender, useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Skeleton from './Skeleton';

export default function DataTable({
  columns, data = [], loading = false, meta, onPageChange, emptyText = 'Belum ada data',
  dense = false,
}) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  const page = meta?.page || 1;
  const total = meta?.total || 0;
  const limit = meta?.limit || data.length || 10;
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-ink-50 dark:bg-ink-900/60">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="th">{flexRender(h.column.columnDef.header, h.getContext())}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-ink-100 dark:divide-ink-700">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((c, j) => (
                      <td key={j} className="td"><Skeleton className="h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
              : data.length === 0
                ? (
                    <tr>
                      <td colSpan={columns.length} className="td text-center py-12 text-ink-400">{emptyText}</td>
                    </tr>
                  )
                : table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className={`hover:bg-ink-50/70 dark:hover:bg-ink-700/40 ${dense ? '' : ''}`}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className={`td ${dense ? 'py-2' : ''}`}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
          </tbody>
        </table>
      </div>

      {meta && total > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-ink-100 dark:border-ink-700 text-sm">
          <span className="text-ink-400">
            Menampilkan {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} dari {total}
          </span>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => onPageChange?.(page - 1)} className="btn-secondary !px-2.5 !py-1.5 disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 font-semibold">{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => onPageChange?.(page + 1)} className="btn-secondary !px-2.5 !py-1.5 disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
