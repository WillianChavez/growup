'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { DateRange, PeriodPreset, PeriodSelection } from '@/types/financial-reports.types';

interface PeriodSelectorProps {
  value: PeriodSelection;
  onChange: (period: PeriodSelection) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: value.customRange?.startDate,
    to: value.customRange?.endDate,
  });

  const presets: { label: string; value: PeriodPreset; getRange: () => DateRange }[] = [
    {
      label: 'Hoy',
      value: 'today',
      getRange: () => {
        const now = new Date();
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
        };
      },
    },
    {
      label: 'Esta Semana',
      value: 'week',
      getRange: () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        return { startDate, endDate };
      },
    },
    {
      label: 'Este Mes',
      value: 'month',
      getRange: () => {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return { startDate, endDate };
      },
    },
    {
      label: 'Este Trimestre',
      value: 'quarter',
      getRange: () => {
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3);
        const startDate = new Date(now.getFullYear(), quarter * 3, 1);
        const endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59);
        return { startDate, endDate };
      },
    },
    {
      label: 'Este Año',
      value: 'year',
      getRange: () => {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), 0, 1);
        const endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        return { startDate, endDate };
      },
    },
  ];

  const handlePresetClick = (preset: PeriodPreset) => {
    if (preset === 'custom') {
      setCalendarOpen(true);
      onChange({ preset: 'custom' });
    } else {
      const presetConfig = presets.find((p) => p.value === preset);
      if (presetConfig) {
        onChange({
          preset,
          customRange: presetConfig.getRange(),
        });
      }
    }
  };

  const handleCustomDateSelect = (range: { from: Date | undefined; to: Date | undefined }) => {
    setCustomDateRange(range);
    if (range.from && range.to) {
      onChange({
        preset: 'custom',
        customRange: {
          startDate: range.from,
          endDate: range.to,
        },
      });
      setCalendarOpen(false);
    }
  };

  const formatDateRange = (period: PeriodSelection): string => {
    if (!period.customRange) return 'Seleccionar período';

    const { startDate, endDate } = period.customRange;
    const formatDate = (date: Date) =>
      date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

    if (startDate.toDateString() === endDate.toDateString()) {
      return formatDate(startDate);
    }

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => (
        <Button
          key={preset.value}
          variant={value.preset === preset.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick(preset.value)}
        >
          {preset.label}
        </Button>
      ))}

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={value.preset === 'custom' ? 'default' : 'outline'}
            size="sm"
            className={cn('justify-start text-left font-normal')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {value.preset === 'custom' ? formatDateRange(value) : 'Personalizado'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="range"
            selected={customDateRange}
            onSelect={
              handleCustomDateSelect as (range: { from?: Date; to?: Date } | undefined) => void
            }
            numberOfMonths={2}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
