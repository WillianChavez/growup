'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AssetDialog } from '@/components/financial/asset-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { Asset, AssetFormData } from '@/types/financial.types';

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/financial/assets');
      if (response.ok) {
        const data = await response.json();
        setAssets(data.data);
      }
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: AssetFormData) => {
    const url = editingAsset ? `/api/financial/assets/${editingAsset.id}` : '/api/financial/assets';
    const method = editingAsset ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      await loadAssets();
    }
  };

  const handleDelete = (id: string) => {
    setAssetToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (assetToDelete) {
      const response = await fetch(`/api/financial/assets/${assetToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        await loadAssets();
        setAssetToDelete(null);
      }
    }
  };

  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const liquidAssets = assets
    .filter((a) => a.type === 'liquid')
    .reduce((sum, a) => sum + a.value, 0);
  const illiquidAssets = assets
    .filter((a) => a.type === 'illiquid')
    .reduce((sum, a) => sum + a.value, 0);

  const chartData = [
    { name: 'Líquidos', value: liquidAssets, color: '#10b981' },
    { name: 'No Líquidos', value: illiquidAssets, color: '#3b82f6' },
  ].filter((item) => item.value > 0);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      cash: '💵',
      investment: '📈',
      property: '🏠',
      vehicle: '🚗',
      other: '📦',
    };
    return icons[category] || '📦';
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Mis Activos
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Gestiona tu patrimonio y activos
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingAsset(undefined);
              setDialogOpen(true);
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Activo
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 xs:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${totalAssets.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Activos Líquidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${liquidAssets.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">
              {totalAssets > 0 ? ((liquidAssets / totalAssets) * 100).toFixed(1) : 0}% del total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Activos No Líquidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${illiquidAssets.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">
              {totalAssets > 0 ? ((illiquidAssets / totalAssets) * 100).toFixed(1) : 0}% del total
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
              <CardTitle>Distribución de Activos</CardTitle>
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

        {/* Assets List */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Activos ({assets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : assets.length === 0 ? (
              <p className="text-center py-8 text-slate-500">
                No tienes activos registrados. Agrega tu primer activo.
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <span className="text-xl">{getCategoryIcon(asset.category)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{asset.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              variant={asset.type === 'liquid' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {asset.type === 'liquid' ? 'Líquido' : 'No Líquido'}
                            </Badge>
                            <span className="font-bold text-blue-600 text-sm">
                              ${asset.value.toFixed(2)}
                            </span>
                          </div>
                          {asset.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {asset.description}
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
                        onClick={() => {
                          setEditingAsset(asset);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        onClick={() => handleDelete(asset.id)}
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

      <AssetDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingAsset(undefined);
        }}
        asset={editingAsset}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="¿Eliminar activo?"
        description="Esta acción no se puede deshacer. Se eliminará el activo permanentemente."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
