'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TransactionCard } from '@/components/finance/transaction-card';
import type { MonthlyTransactionGroup, Transaction } from '@/types/finance.types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/useIsMobile';

interface MonthlyGroupViewProps {
  groups: MonthlyTransactionGroup[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
}

export function MonthlyGroupView({ groups, onEdit, onDelete }: MonthlyGroupViewProps) {
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
    new Set([format(new Date(), 'yyyy-MM')])
  );

  const isMobile = useIsMobile();

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey);
      } else {
        newSet.add(monthKey);
      }
      return newSet;
    });
  };

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-500">
          No hay transacciones para mostrar
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 mb-20 sm:mb-6">
      {groups.map((group) => {
        // Parse month from string "YYYY-MM" format
        const monthParts = group.month.split('-');
        const year = parseInt(monthParts[0]);
        const month = parseInt(monthParts[1]);
        const monthKey = group.month;
        const isExpanded = expandedMonths.has(monthKey);

        return (
          <Card key={monthKey} className="">
            <CardContent className="p-0">
              {/* Month Header */}

              {/* Stats Section */}
              {isMobile && (
                <div className="text-left sm:text-right w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                  <div className="grid grid-cols-3 sm:flex sm:flex-nowrap items-center gap-2 sm:gap-4">
                    <div className="sm:flex-none min-w-0 text-center sm:text-left">
                      <p className="text-[10px] sm:text-xs text-slate-500">Ingresos</p>
                      <p className="font-semibold text-xs sm:text-base text-green-600 truncate">
                        ${group.totalIncome.toFixed(2)}
                      </p>
                    </div>
                    <div className="sm:flex-none min-w-0 text-center sm:text-left">
                      <p className="text-[10px] sm:text-xs text-slate-500">Gastos</p>
                      <p className="font-semibold text-xs sm:text-base text-red-600 truncate">
                        ${group.totalExpenses.toFixed(2)}
                      </p>
                    </div>
                    <div className="sm:flex-none min-w-0 text-center sm:text-left">
                      <p className="text-[10px] sm:text-xs text-slate-500">Balance</p>
                      <p
                        className={`font-bold text-xs sm:text-lg truncate ${
                          group.balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {group.balance >= 0 ? '+' : ''}${group.balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="relative z-10 bg-white dark:bg-slate-950 rounded-t-lg mb-10">
                <Button
                  variant="ghost"
                  className="w-full p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 gap-3 sm:gap-4"
                  onClick={() => toggleMonth(monthKey)}
                >
                  {/* Title Section */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    )}
                    <div className="text-left min-w-0 flex-1">
                      <h3 className="font-semibold text-base sm:text-lg truncate">
                        {format(new Date(year, month - 1), 'MMMM yyyy', { locale: es })}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500">
                        {group.transactions.length} transacciones
                      </p>
                    </div>
                  </div>

                  {!isMobile && (
                    <div className="text-left sm:text-right w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                      <div className="grid grid-cols-3 sm:flex sm:flex-nowrap items-center gap-2 sm:gap-4">
                        <div className="sm:flex-none min-w-0 text-center sm:text-left">
                          <p className="text-[10px] sm:text-xs text-slate-500">Ingresos</p>
                          <p className="font-semibold text-xs sm:text-base text-green-600 truncate">
                            ${group.totalIncome.toFixed(2)}
                          </p>
                        </div>
                        <div className="sm:flex-none min-w-0 text-center sm:text-left">
                          <p className="text-[10px] sm:text-xs text-slate-500">Gastos</p>
                          <p className="font-semibold text-xs sm:text-base text-red-600 truncate">
                            ${group.totalExpenses.toFixed(2)}
                          </p>
                        </div>
                        <div className="sm:flex-none min-w-0 text-center sm:text-left">
                          <p className="text-[10px] sm:text-xs text-slate-500">Balance</p>
                          <p
                            className={`font-bold text-xs sm:text-lg truncate ${
                              group.balance >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {group.balance >= 0 ? '+' : ''}${group.balance.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </Button>
              </div>

              {/* Transactions List */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden relative"
                  >
                    <div className="p-4  space-y-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-b-lg">
                      {group.transactions.map((transaction, index) => (
                        <TransactionCard
                          key={transaction.id}
                          transaction={transaction}
                          index={index}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
