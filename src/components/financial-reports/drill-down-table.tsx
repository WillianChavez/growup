'use client';

import { useState, Fragment } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CategoryBreakdown } from '@/types/financial-reports.types';
import { formatCurrency } from '@/lib/utils';

interface DrillDownTableProps {
  categories: CategoryBreakdown[];
  total: number;
  title: string;
  showTransactions?: boolean;
}

export function DrillDownTable({
  categories,
  total,
  title,
  showTransactions = true,
}: DrillDownTableProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead className="text-right">%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-slate-500">
                No hay datos para este período
              </TableCell>
            </TableRow>
          ) : (
            <>
              {categories.map((category) => {
                const isExpanded = expandedCategories.has(category.categoryId);
                const hasTransactions =
                  showTransactions && category.transactions && category.transactions.length > 0;

                return (
                  <Fragment key={category.categoryId}>
                    <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <TableCell>
                        {hasTransactions && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCategory(category.categoryId)}
                            className="h-6 w-6 p-0"
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
                          <span className="text-xl">{category.emoji}</span>
                          <span className="font-medium">{category.categoryName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{category.transactionCount}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(category.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-slate-600 dark:text-slate-400">
                          {category.percentage.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>

                    {/* Transacciones expandidas */}
                    {isExpanded && hasTransactions && (
                      <>
                        {category.transactions!.map((transaction) => (
                          <TableRow key={transaction.id} className="bg-slate-50 dark:bg-slate-900">
                            <TableCell></TableCell>
                            <TableCell className="pl-12">
                              <div className="text-sm">
                                <div className="font-medium text-slate-700 dark:text-slate-300">
                                  {transaction.description}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {new Date(transaction.date).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right text-sm">
                              {formatCurrency(transaction.amount)}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}
                  </Fragment>
                );
              })}

              {/* Fila de total */}
              <TableRow className="font-bold bg-slate-100 dark:bg-slate-800">
                <TableCell></TableCell>
                <TableCell>Total</TableCell>
                <TableCell className="text-right">
                  {categories.reduce((sum, cat) => sum + cat.transactionCount, 0)}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                <TableCell className="text-right">100%</TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
