import { Key, Zap } from 'lucide-react';

const BASE = 'https://tu-app.com';

const endpoints = [
  {
    group: 'Objetivos',
    items: [
      {
        method: 'GET',
        path: '/api/goals',
        desc: 'Listar objetivos',
        params: '?status=not-started|in-progress|completed|abandoned',
      },
      {
        method: 'POST',
        path: '/api/goals',
        desc: 'Crear objetivo',
        body: '{ title, description?, category, priority?, targetDate?, milestones? }',
      },
      {
        method: 'PATCH',
        path: '/api/goals/:id',
        desc: 'Actualizar objetivo',
        body: '{ title?, status?, progress?, priority?, targetDate? }',
      },
      { method: 'DELETE', path: '/api/goals/:id', desc: 'Eliminar objetivo' },
    ],
  },
  {
    group: 'Hábitos',
    items: [
      {
        method: 'GET',
        path: '/api/habits',
        desc: 'Listar hábitos',
        params: '?includeArchived=true',
      },
      {
        method: 'POST',
        path: '/api/habits',
        desc: 'Crear hábito',
        body: '{ title, emoji?, categoryId, description? }',
      },
      {
        method: 'PATCH',
        path: '/api/habits/:id',
        desc: 'Actualizar hábito',
        body: '{ title?, emoji?, isActive? }',
      },
      { method: 'DELETE', path: '/api/habits/:id', desc: 'Eliminar hábito' },
      {
        method: 'POST',
        path: '/api/habits/:id/entries',
        desc: 'Registrar entrada de hábito',
        body: '{ date, completed, notes? }',
      },
      { method: 'GET', path: '/api/habit-categories', desc: 'Listar categorías de hábitos' },
      {
        method: 'POST',
        path: '/api/habit-categories',
        desc: 'Crear categoría de hábito',
        body: '{ name, emoji?, color? }',
      },
    ],
  },
  {
    group: 'Finanzas — Transacciones',
    items: [
      {
        method: 'GET',
        path: '/api/transactions',
        desc: 'Listar transacciones',
        params: '?type=income|expense',
      },
      {
        method: 'POST',
        path: '/api/transactions',
        desc: 'Crear transacción',
        body: '{ type, amount, description, categoryId, date?, notes? }',
      },
      {
        method: 'GET',
        path: '/api/transaction-categories',
        desc: 'Listar categorías',
        params: '?type=income|expense|both',
      },
      {
        method: 'POST',
        path: '/api/transaction-categories',
        desc: 'Crear categoría',
        body: '{ name, emoji, type, color? }',
      },
    ],
  },
  {
    group: 'Finanzas — Presupuesto',
    items: [
      { method: 'GET', path: '/api/budget/income-sources', desc: 'Listar fuentes de ingreso' },
      {
        method: 'POST',
        path: '/api/budget/income-sources',
        desc: 'Agregar fuente de ingreso',
        body: '{ name, amount, frequency }',
      },
      {
        method: 'PATCH',
        path: '/api/budget/income-sources/:id',
        desc: 'Actualizar fuente de ingreso',
        body: '{ name?, amount?, frequency? }',
      },
      {
        method: 'DELETE',
        path: '/api/budget/income-sources/:id',
        desc: 'Eliminar fuente de ingreso',
      },
      { method: 'GET', path: '/api/budget/recurring-expenses', desc: 'Listar gastos recurrentes' },
      {
        method: 'POST',
        path: '/api/budget/recurring-expenses',
        desc: 'Agregar gasto recurrente',
        body: '{ name, amount, frequency, category? }',
      },
      {
        method: 'PATCH',
        path: '/api/budget/recurring-expenses/:id',
        desc: 'Actualizar gasto recurrente',
        body: '{ name?, amount?, frequency? }',
      },
      {
        method: 'DELETE',
        path: '/api/budget/recurring-expenses/:id',
        desc: 'Eliminar gasto recurrente',
      },
      { method: 'GET', path: '/api/budget/summary', desc: 'Resumen del presupuesto mensual' },
    ],
  },
  {
    group: 'Lectura — Libros',
    items: [
      {
        method: 'GET',
        path: '/api/books',
        desc: 'Listar libros',
        params: '?status=reading|completed|to-read|abandoned',
      },
      {
        method: 'POST',
        path: '/api/books',
        desc: 'Agregar libro',
        body: '{ title, author, pages, status?, currentPage?, rating?, review?, startDate?, endDate? }',
      },
      {
        method: 'PATCH',
        path: '/api/books/:id',
        desc: 'Actualizar libro',
        body: '{ status?, currentPage?, rating?, review?, notes?, endDate? }',
      },
      { method: 'DELETE', path: '/api/books/:id', desc: 'Eliminar libro' },
    ],
  },
  {
    group: 'Finanzas — Activos y Deudas',
    items: [
      { method: 'GET', path: '/api/financial/assets', desc: 'Listar activos' },
      {
        method: 'POST',
        path: '/api/financial/assets',
        desc: 'Crear activo',
        body: '{ name, value, type, category, description? }',
      },
      { method: 'GET', path: '/api/financial/debts', desc: 'Listar deudas' },
      {
        method: 'POST',
        path: '/api/financial/debts',
        desc: 'Crear deuda',
        body: '{ creditor, totalAmount, remainingAmount, monthlyPayment, annualRate, type, startDate }',
      },
    ],
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  PATCH: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-medium">
            <Zap className="h-4 w-4" />
            GrowUp API
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Documentación para Desarrolladores
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Accede a todos los datos de tu cuenta con una API key. Úsala desde cualquier herramienta
            externa como AI assistants, scripts, o integraciones.
          </p>
        </div>

        {/* Auth */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Key className="h-5 w-5 text-indigo-500" />
            Autenticación
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Incluye tu API key en el header{' '}
              <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">
                X-API-Key
              </code>{' '}
              en cada request. Genera tu key en{' '}
              <a href="/settings" className="text-indigo-600 hover:underline">
                Configuración → API Key
              </a>
              .
            </p>
            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4">
              <pre className="text-sm text-slate-100 font-mono overflow-x-auto">{`curl -H "X-API-Key: gup_tu_api_key" \\
     ${BASE}/api/goals`}</pre>
            </div>
            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4">
              <pre className="text-sm text-slate-100 font-mono overflow-x-auto">{`# Crear un objetivo con hitos
curl -X POST ${BASE}/api/goals \\
  -H "X-API-Key: gup_tu_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Correr 5k",
    "category": "health",
    "priority": "high",
    "milestones": [
      { "title": "Correr 1k sin parar" },
      { "title": "Correr 3k" },
      { "title": "Completar 5k" }
    ]
  }'`}</pre>
            </div>
          </div>
        </section>

        {/* Response format */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Formato de respuesta
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4">
              <pre className="text-sm text-slate-100 font-mono overflow-x-auto">{`// Éxito
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Mensaje de error" }`}</pre>
            </div>
          </div>
        </section>

        {/* Endpoints */}
        <section className="space-y-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Endpoints</h2>
          {endpoints.map((group) => (
            <div key={group.group} className="space-y-3">
              <h3 className="font-medium text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">
                {group.group}
              </h3>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                {group.items.map((ep, i) => (
                  <div key={i} className="p-4 flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${METHOD_COLORS[ep.method]}`}
                      >
                        {ep.method}
                      </span>
                      <code className="text-sm font-mono text-slate-800 dark:text-slate-200">
                        {ep.path}
                        {ep.params && <span className="text-slate-400">{ep.params}</span>}
                      </code>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 pl-14">{ep.desc}</p>
                    {ep.body && (
                      <div className="pl-14 mt-1">
                        <code className="text-xs font-mono text-slate-500 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded block">
                          Body: {ep.body}
                        </code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 pb-6">
          GrowUp API — todos los endpoints requieren autenticación excepto esta página.
        </p>
      </div>
    </div>
  );
}
