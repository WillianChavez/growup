'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Loader2,
  Download,
  Upload,
  Key,
  Copy,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/stores/user-store';

export default function SettingsPage() {
  const { user, isLoading: userLoading, updateUser } = useUserStore();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API Key state
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyLoading, setApiKeyLoading] = useState(true);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiKeyGenerating, setApiKeyGenerating] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  useEffect(() => {
    fetch('/api/user/api-key')
      .then((r) => r.json())
      .then((r) => {
        if (r.success) setApiKey(r.data.apiKey);
      })
      .finally(() => setApiKeyLoading(false));
  }, []);

  const handleGenerateApiKey = async () => {
    setApiKeyGenerating(true);
    try {
      const r = await fetch('/api/user/api-key', { method: 'POST' });
      const data = await r.json();
      if (data.success) {
        setApiKey(data.data.apiKey);
        setApiKeyVisible(true);
      }
    } finally {
      setApiKeyGenerating(false);
    }
  };

  const handleRevokeApiKey = async () => {
    if (!confirm('¿Revocar la API key? Dejarás de poder usarla en herramientas externas.')) return;
    await fetch('/api/user/api-key', { method: 'DELETE' });
    setApiKey(null);
    setApiKeyVisible(false);
  };

  const handleCopyApiKey = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          updateUser(result.data);
          alert('Perfil actualizado exitosamente');
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/data/export');
      if (response.ok) {
        const data = await response.json();
        const dataStr = JSON.stringify(data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `growup-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alert('Datos exportados exitosamente');
      } else {
        throw new Error('Error al exportar datos');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error al exportar los datos');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const response = await fetch('/api/data/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Datos importados exitosamente. Recarga la página para ver los cambios.');
        window.location.reload();
      } else {
        throw new Error('Error al importar datos');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Error al importar los datos. Verifica que el archivo sea válido.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (userLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Configuración</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Personaliza tu experiencia en GrowUp
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Configuración</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Personaliza tu experiencia en GrowUp
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Información de tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-slate-100 dark:bg-slate-800"
              />
            </div>
            <Button onClick={handleSave} disabled={isSaving || name === user?.name}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </CardContent>
        </Card>

        {/* API Key */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Key
            </CardTitle>
            <CardDescription>
              Úsala para acceder a tu cuenta desde herramientas externas como AI assistants.{' '}
              <a
                href="/developers"
                target="_blank"
                className="text-indigo-600 hover:underline inline-flex items-center gap-1"
              >
                Ver documentación <ExternalLink className="h-3 w-3" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {apiKeyLoading ? (
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
              </div>
            ) : apiKey ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={apiKeyVisible ? apiKey : '•'.repeat(Math.min(apiKey.length, 40))}
                    className="font-mono text-sm bg-slate-50 dark:bg-slate-900"
                  />
                  <Button variant="ghost" size="icon" onClick={() => setApiKeyVisible((v) => !v)}>
                    {apiKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleCopyApiKey}>
                    {apiKeyCopied ? (
                      <span className="text-xs text-emerald-600">✓</span>
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateApiKey}
                    disabled={apiKeyGenerating}
                  >
                    {apiKeyGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Regenerar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={handleRevokeApiKey}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Revocar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No tienes una API key activa.
                </p>
                <Button onClick={handleGenerateApiKey} disabled={apiKeyGenerating}>
                  {apiKeyGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Key className="mr-2 h-4 w-4" />
                  )}
                  Generar API Key
                </Button>
              </div>
            )}
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Trata tu API key como una contraseña. Quien la tenga tendrá acceso completo a tu
                cuenta.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Datos</CardTitle>
            <CardDescription>Exporta o importa tus datos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Exportar Datos</Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Descarga todos tus datos en formato JSON
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleExportData}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Exportar Datos
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Importar Datos</Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Importa tus datos desde un archivo JSON
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleImportData}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                {isImporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Importar Datos
              </Button>
            </div>

            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 p-3 border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                ⚠️ La importación de datos sobrescribirá tus datos actuales. Asegúrate de hacer una
                copia de seguridad primero.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
