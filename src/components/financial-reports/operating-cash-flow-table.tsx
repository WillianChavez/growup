'use client';

import { Fragment, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { OperatingCashFlowBreakdown } from '@/types/financial-reports.types';
import { cn, formatCurrency } from '@/lib/utils';

interface OperatingCashFlowTableProps {
  categories: OperatingCashFlowBreakdown[];
  inflows: number;
  outflows: number;
  net: number;
}

function signedAmount(amount: number) {
  if (amount === 0) return formatCurrency(0);
  return `${amount > 0 ? '+' : '−'} ${formatCurrency(Math.abs(amount))}`;
}

export function OperatingCashFlowTable({
  categories,
  inflows,
  outflows,
  net,
}: OperatingCashFlowTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (rowId: string) => {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  const transactionCount = categories.reduce((sum, category) => sum + category.transactionCount, 0);

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
          <TableRow>
            <TableHead className="w-10" aria-label="Expandir detalle" />
            <TableHead>Categoría</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Operaciones</TableHead>
            <TableHead className="text-right text-emerald-700 dark:text-emerald-400">
              Entradas (+)
            </TableHead>
            <TableHead className="text-right text-red-700 dark:text-red-400">Salidas (−)</TableHead>
            <TableHead className="text-right">Impacto (=)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-20 text-center text-slate-500">
                No hay operaciones para este período
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => {
              const isInflow = category.direction === 'inflow';
              const rowId = `${category.direction}:${category.categoryId}`;
              const isExpanded = expandedRows.has(rowId);
              const hasTransactions = Boolean(category.transactions?.length);

              return (
                <Fragment key={rowId}>
                  <TableRow>
                    <TableCell>
                      {hasTransactions && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(rowId)}
                          className="h-7 w-7 p-0"
                          aria-label={`${isExpanded ? 'Ocultar' : 'Mostrar'} operaciones de ${category.categoryName}`}
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden="true">
                          {category.emoji}
                        </span>
                        <span className="font-medium">{category.categoryName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          isInflow
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-400'
                            : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400'
                        )}
                      >
                        {isInflow ? (
                          <ArrowDownLeft aria-hidden="true" />
                        ) : (
                          <ArrowUpRight aria-hidden="true" />
                        )}
                        {isInflow ? 'Entrada' : 'Salida'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {category.transactionCount}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {isInflow ? signedAmount(category.amount) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-red-700 dark:text-red-400">
                      {isInflow ? '—' : signedAmount(-category.amount)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-bold tabular-nums',
                        isInflow
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-red-700 dark:text-red-400'
                      )}
                    >
                      {signedAmount(isInflow ? category.amount : -category.amount)}
                    </TableCell>
                  </TableRow>

                  {isExpanded &&
                    category.transactions?.map((transaction) => {
                      const transactionIsInflow = transaction.type === 'income';

                      return (
                        <TableRow
                          key={transaction.id}
                          className="bg-slate-50/70 dark:bg-slate-900/40"
                        >
                          <TableCell />
                          <TableCell className="pl-10">
                            <div className="max-w-64 whitespace-normal text-sm">
                              <p className="font-medium text-slate-700 dark:text-slate-300">
                                {transaction.description}
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(transaction.date).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">Detalle</TableCell>
                          <TableCell className="text-right tabular-nums">1</TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-700 dark:text-emerald-400">
                            {transactionIsInflow ? signedAmount(transaction.amount) : '—'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-red-700 dark:text-red-400">
                            {transactionIsInflow ? '—' : signedAmount(-transaction.amount)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-medium tabular-nums',
                              transactionIsInflow
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-red-700 dark:text-red-400'
                            )}
                          >
                            {signedAmount(
                              transactionIsInflow ? transaction.amount : -transaction.amount
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </Fragment>
              );
            })
          )}
        </TableBody>
        {categories.length > 0 && (
          <TableFooter className="border-t-2 bg-slate-100 dark:bg-slate-900">
            <TableRow>
              <TableCell />
              <TableCell className="font-bold">Totales del período</TableCell>
              <TableCell className="text-xs font-normal text-slate-500">
                Entradas − salidas
              </TableCell>
              <TableCell className="text-right font-bold tabular-nums">
                {transactionCount}
              </TableCell>
              <TableCell className="text-right font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {signedAmount(inflows)}
              </TableCell>
              <TableCell className="text-right font-bold tabular-nums text-red-700 dark:text-red-400">
                {signedAmount(-outflows)}
              </TableCell>
              <TableCell
                className={cn(
                  'text-right text-base font-extrabold tabular-nums',
                  net >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-red-700 dark:text-red-400'
                )}
              >
                {signedAmount(net)}
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
