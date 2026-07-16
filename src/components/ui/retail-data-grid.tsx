import type { ReactNode } from "react";

import { FoundationState } from "@/components/ui/state";
import { cn } from "@/lib/utils";

export type RetailDataGridColumn<Row> = Readonly<{
  align?: "end" | "start";
  header: string;
  id: string;
  render: (row: Row) => ReactNode;
}>;

export type RetailDataGridProps<Row> = Readonly<{
  caption: string;
  className?: string;
  columns: readonly RetailDataGridColumn<Row>[];
  emptyTitle?: string;
  getRowKey: (row: Row, index: number) => string;
  rows: readonly Row[];
}>;

export function RetailDataGrid<Row>({
  caption,
  className,
  columns,
  emptyTitle = "No records yet",
  getRowKey,
  rows,
}: RetailDataGridProps<Row>) {
  if (rows.length === 0) {
    return (
      <FoundationState kind="empty" title={emptyTitle}>
        This shared grid is ready for tenant-scoped records when an approved
        workflow provides them.
      </FoundationState>
    );
  }

  return (
    <div className={cn("retail-data-grid-wrap", className)}>
      <table className="retail-data-grid">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                className={column.align === "end" ? "text-align-end" : undefined}
                key={column.id}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={getRowKey(row, index)}>
              {columns.map((column) => (
                <td
                  className={column.align === "end" ? "text-align-end" : undefined}
                  key={column.id}
                >
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
