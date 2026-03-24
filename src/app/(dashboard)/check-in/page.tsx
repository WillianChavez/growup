'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, PlusCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDailyHabits } from '@/hooks/useDailyHabits';
import type { DailyHabitView } from '@/types/habit.types';
import { useUserStore } from '@/stores/user-store';

interface FocusAlert {
  id: string;
  type: 'budget' | 'habit' | 'goal' | 'expense_due' | 'holiday';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
}

interface WeeklyReview {
  finance: {
    income: number;
    expenses: number;
    balance: number;
    deltaBalance: number;
  };
  habits: {
    completionRate: number;
    previousCompletionRate: number;
    deltaCompletionRate: number;
  };
  goals: {
    completedThisWeek: number;
    completedPreviousWeek: number;
    deltaCompleted: number;
  };
  insights: string[];
}

interface WeatherSummary {
  temperature: number;
  windspeed: number;
  precipitationProbability?: number;
  description: string;
  location: string;
  timezone: string;
}

interface ConversionResult {
  currency: string;
  rate: number;
  converted: number;
}

interface CurrencySummary {
  base: string;
  date: string;
  conversions: ConversionResult[];
}

const quickExamples = [
  'gasto 12 cafe',
  'ingreso 150 freelance',
  'habito leer 20 min',
  'meta correr 5k',
];

export default function CheckInPage() {
  const [command, setCommand] = useState('');
  const [alerts, setAlerts] = useState<FocusAlert[]>([]);
  const [weeklyReview, setWeeklyReview] = useState<WeeklyReview | null>(null);
  const [dailyView, setDailyView] = useState<DailyHabitView | null>(null);
  const [isSubmittingQuickAdd, setIsSubmittingQuickAdd] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [currencySummary, setCurrencySummary] = useState<CurrencySummary | null>(null);

  const { fetchDailyView, toggleHabit } = useDailyHabits();
  const { user } = useUserStore();

  const completion = useMemo(() => {
    if (!dailyView || dailyView.habits.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const completed = dailyView.habits.filter((item) => item.entry?.completed).length;
    const total = dailyView.habits.length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  }, [dailyView]);

  const loadCheckInData = async () => {
    try {
      setIsLoading(true);

      const [daily, alertsResponse, weeklyResponse, weatherResponse] = await Promise.all([
        fetchDailyView(new Date()),
        fetch('/api/alerts'),
        fetch('/api/weekly-review'),
        fetch('/api/weather'),
      ]);

      setDailyView(daily);

      if (alertsResponse.ok) {
        const result = await alertsResponse.json();
        setAlerts(result.data || []);
      }

      if (weeklyResponse.ok) {
        const result = await weeklyResponse.json();
        setWeeklyReview(result.data || null);
      }

      if (weatherResponse.ok) {
        const result = await weatherResponse.json();
        setWeather(result.data || null);
      }
    } catch (error) {
      console.error('Error loading check-in data:', error);
      toast.error('No se pudo cargar la pantalla de check-in');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCheckInData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuickAdd = async () => {
    if (!command.trim()) return;

    try {
      setIsSubmittingQuickAdd(true);
      const response = await fetch('/api/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: command.trim() }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error || 'No se pudo procesar el comando');
        return;
      }

      toast.success(result.message || 'Registro creado');
      setCommand('');
      await loadCheckInData();
    } catch (error) {
      console.error('Error quick add:', error);
      toast.error('No se pudo procesar Quick Add');
    } finally {
      setIsSubmittingQuickAdd(false);
    }
  };

  const loadCurrencySummary = useCallback(async () => {
    if (!user?.currency) {
      setCurrencySummary(null);
      return;
    }

    try {
      const response = await fetch(
        `/api/currency/convert?from=${encodeURIComponent(user.currency)}&amount=1&symbols=USD,EUR`
      );
      if (!response.ok) return;
      const result = await response.json();
      setCurrencySummary(result.data || null);
    } catch (error) {
      console.error('Error loading currency conversions:', error);
    }
  }, [user?.currency]);

  useEffect(() => {
    void loadCurrencySummary();
  }, [loadCurrencySummary]);

  const handleToggleHabit = async (habitId: string, completed: boolean) => {
    const success = await toggleHabit(habitId, new Date(), completed);
    if (!success) {
      toast.error('No se pudo actualizar el hábito');
      return;
    }

    const updated = await fetchDailyView(new Date());
    setDailyView(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Check-in diario</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Resuelve hábitos, registra rápido y cierra tu semana con contexto.
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Sparkles className="h-3.5 w-3.5" />
          Fase 3
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PlusCircle className="h-4 w-4" />
            Quick Add
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder='Ej: "gasto 12 cafe" o "meta correr 5k"'
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleQuickAdd();
                }
              }}
            />
            <Button onClick={() => void handleQuickAdd()} disabled={isSubmittingQuickAdd}>
              Agregar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickExamples.map((example) => (
              <Button key={example} variant="outline" size="sm" onClick={() => setCommand(example)}>
                {example}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              Clima actual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading || !weather ? (
              <p className="text-sm text-slate-500">Cargando clima...</p>
            ) : (
              <>
                <p className="text-sm text-slate-500">{weather.location}</p>
                <p className="text-3xl font-semibold text-slate-900 dark:text-white">
                  {weather.temperature.toFixed(1)}°C
                </p>
                <p className="text-sm text-slate-600">{weather.description}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Viento {weather.windspeed.toFixed(1)} km/h • Prob. precipitación{' '}
                  {weather.precipitationProbability ?? 0}%
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4" />
              Conversiones rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {currencySummary && currencySummary.conversions.length > 0 ? (
              <div className="text-sm text-slate-600 dark:text-slate-300">
                {currencySummary.conversions.map((conversion) => (
                  <div key={conversion.currency} className="flex justify-between">
                    <span>
                      1 {currencySummary.base} → {conversion.currency}
                    </span>
                    <span className="font-semibold">
                      {conversion.converted.toFixed(2)} ({conversion.rate.toFixed(4)})
                    </span>
                  </div>
                ))}
                <p className="text-xs text-slate-500">Actualizado {currencySummary.date}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Usa tu moneda base en perfil para ver conversiones.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-4 w-4" />
              Hábitos de hoy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>
                  {completion.completed}/{completion.total} completados
                </span>
                <span>{completion.percentage}%</span>
              </div>
              <Progress value={completion.percentage} className="mt-2" />
            </div>

            {isLoading ? (
              <p className="text-sm text-slate-500">Cargando hábitos...</p>
            ) : dailyView && dailyView.habits.length > 0 ? (
              <div className="space-y-2">
                {dailyView.habits.map((item) => {
                  const completed = !!item.entry?.completed;
                  return (
                    <button
                      key={item.habit.id}
                      type="button"
                      onClick={() => void handleToggleHabit(item.habit.id, !completed)}
                      className={`w-full rounded-md border px-3 py-2 text-left transition ${
                        completed
                          ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30'
                          : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {item.habit.emoji} {item.habit.title}
                        </span>
                        {completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <span className="text-xs text-slate-500">Pendiente</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No tienes hábitos activos para hoy.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Centro de alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-slate-500">Cargando alertas...</p>
            ) : alerts.length === 0 ? (
              <p className="text-sm text-slate-500">Sin alertas por ahora.</p>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-md border px-3 py-2 ${
                    alert.severity === 'high'
                      ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20'
                      : alert.severity === 'medium'
                        ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20'
                        : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{alert.description}</p>
                  {alert.actionLabel && alert.actionUrl && (
                    <a
                      href={alert.actionUrl}
                      className="mt-1 inline-block text-xs font-medium text-blue-600 hover:underline"
                    >
                      {alert.actionLabel}
                    </a>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cierre semanal automático</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading || !weeklyReview ? (
            <p className="text-sm text-slate-500">Cargando resumen semanal...</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-slate-500">Balance semana</p>
                  <p className="text-lg font-semibold">
                    ${weeklyReview.finance.balance.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Δ ${weeklyReview.finance.deltaBalance.toFixed(2)} vs semana anterior
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-slate-500">Cumplimiento hábitos</p>
                  <p className="text-lg font-semibold">
                    {weeklyReview.habits.completionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500">
                    Δ {weeklyReview.habits.deltaCompletionRate.toFixed(1)} pts
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-slate-500">Metas completadas</p>
                  <p className="text-lg font-semibold">{weeklyReview.goals.completedThisWeek}</p>
                  <p className="text-xs text-slate-500">
                    Δ {weeklyReview.goals.deltaCompleted} vs semana anterior
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {weeklyReview.insights.map((insight, index) => (
                  <p
                    key={`${insight}-${index}`}
                    className="rounded-md bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800"
                  >
                    {insight}
                  </p>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
