import type { ReactNode } from "react";

import { EmptyState } from "./StateBlock";

export interface TableColumn<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: TableColumn<T>[];
  getRowKey: (row: T) => string | number;
  emptyTitle: string;
  emptyMessage: string;
}

export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  emptyTitle,
  emptyMessage,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th className={column.className} key={column.header} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td className={column.className} key={column.header}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
