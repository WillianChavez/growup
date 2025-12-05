'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DebtDialog } from '@/components/financial/debt-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { Debt, DebtFormData } from '@/types/financial.types';

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showPaid, setShowPaid] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/financial/debts');
      if (response.ok) {
        const data = await response.json();
        setDebts(data.data);
      }
    } catch (error) {
      console.error('Error loading debts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: DebtFormData) => {
    const url = editingDebt ? `/api/financial/debts/${editingDebt.id}` : '/api/financial/debts';
    const method = editingDebt ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      await loadDebts();
    }
  };

  const handleDelete = (id: string) => {
    setDebtToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (debtToDelete) {
      const response = await fetch(`/api/financial/debts/${debtToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        await loadDebts();
        setDebtToDelete(null);
      }
    }
  };

  const handleMarkAsPaid = async (debt: Debt) => {
    const response = await fetch(`/api/financial/debts/${debt.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...debt,
        status: debt.status === 'paid' ? 'active' : 'paid',
        remainingAmount: debt.status === 'paid' ? debt.totalAmount : 0,
      }),
    });

    if (response.ok) {
      await loadDebts();
    }
  };

  const filteredDebts = showPaid ? debts : debts.filter((d) => d.status === 'active');
  const activeDebts = debts.filter((d) => d.status === 'active');

  const totalDebt = activeDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalMonthlyPayment = activeDebts.reduce((sum, d) => sum + d.monthlyPayment, 0);
  const consumptionDebt = activeDebts
    .filter((d) => d.type === 'consumption')
    .reduce((sum, d) => sum + d.monthlyPayment, 0);

  const chartData = [
    {
      name: 'Consumo',
      value: activeDebts
        .filter((d) => d.type === 'consumption')
        .reduce((sum, d) => sum + d.remainingAmount, 0),
      color: '#ef4444',
    },
    {
      name: 'Vivienda',
      value: activeDebts
        .filter((d) => d.type === 'housing')
        .reduce((sum, d) => sum + d.remainingAmount, 0),
      color: '#3b82f6',
    },
    {
      name: 'Educación',
      value: activeDebts
        .filter((d) => d.type === 'education')
        .reduce((sum, d) => sum + d.remainingAmount, 0),
      color: '#10b981',
    },
    {
      name: 'Vehículo',
      value: activeDebts
        .filter((d) => d.type === 'vehicle')
        .reduce((sum, d) => sum + d.remainingAmount, 0),
      color: '#f59e0b',
    },
    {
      name: 'Otros',
      value: activeDebts
        .filter((d) => d.type === 'other')
        .reduce((sum, d) => sum + d.remainingAmount, 0),
      color: '#8b5cf6',
    },
  ].filter((item) => item.value > 0);

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      consumption: '💳',
      housing: '🏠',
      education: '📚',
      vehicle: '🚗',
      other: '📦',
    };
    return icons[type] || '📦';
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Mis Deudas
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Controla tu endeudamiento
            </p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center space-x-2">
              <Switch id="show-paid" checked={showPaid} onCheckedChange={setShowPaid} />
              <Label htmlFor="show-paid">Ver pagadas</Label>
            </div>
            <Button
              onClick={() => {
                setEditingDebt(undefined);
                setDialogOpen(true);
              }}
              className="flex-1 sm:flex-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Deuda
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 xs:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Deuda Total Activa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalDebt.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">{activeDebts.length} deudas activas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pago Mensual Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${totalMonthlyPayment.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pago Consumo Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">${consumptionDebt.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">
              {totalMonthlyPayment > 0
                ? ((consumptionDebt / totalMonthlyPayment) * 100).toFixed(1)
                : 0}
              % del total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart and List */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Debts List */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Deudas ({filteredDebts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : filteredDebts.length === 0 ? (
              <p className="text-center py-8 text-slate-500">
                {showPaid
                  ? 'No tienes deudas registradas.'
                  : 'No tienes deudas activas. ¡Felicidades!'}
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredDebts.map((debt) => (
                  <div
                    key={debt.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <span className="text-xl">{getTypeIcon(debt.type)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{debt.creditor}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              variant={debt.status === 'paid' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {debt.status === 'paid' ? 'Pagada' : 'Activa'}
                            </Badge>
                            <span className="text-xs text-slate-500">{debt.annualRate}% anual</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            ${debt.remainingAmount.toFixed(2)} de ${debt.totalAmount.toFixed(2)} • $
                            {debt.monthlyPayment.toFixed(2)}/mes
                          </p>
                          {debt.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {debt.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMarkAsPaid(debt)}
                        title={debt.status === 'paid' ? 'Marcar como activa' : 'Marcar como pagada'}
                      >
                        <CheckCircle2
                          className={`h-4 w-4 ${debt.status === 'paid' ? 'text-green-600' : 'text-slate-400'}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingDebt(debt);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        onClick={() => handleDelete(debt.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DebtDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingDebt(undefined);
        }}
        debt={editingDebt}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="¿Eliminar deuda?"
        description="Esta acción no se puede deshacer. Se eliminará la deuda permanentemente."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
