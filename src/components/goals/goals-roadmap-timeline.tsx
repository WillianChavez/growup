'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { CalendarRange } from 'lucide-react';
import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  format,
  startOfQuarter,
  subDays,
  subMonths,
  subQuarters,
  subWeeks,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import type { Goal, GoalStatus, Milestone } from '@/types/goal.types';
import { cn } from '@/lib/utils';
import { ViewMode } from 'gantt-task-react';
import type { Task } from 'gantt-task-react';
import type { StylingOption } from 'gantt-task-react/dist/types/public-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Gantt = dynamic(() => import('gantt-task-react').then((mod) => mod.Gantt), {
  ssr: false,
});

const EmptyTooltip: NonNullable<StylingOption['TooltipContent']> = () => null;

export type TimelineScale = 'day' | 'week' | 'month' | 'quarter';
export interface TimelineColumnWidths {
  activity: number;
  from: number;
  to: number;
}
type MilestoneState = 'not-started' | 'in-progress' | 'completed';

interface GoalsRoadmapTimelineProps {
  goals: Goal[];
  scale: TimelineScale;
  anchorDate: Date;
  columnWidths: TimelineColumnWidths;
  onColumnWidthsChange: (widths: TimelineColumnWidths) => void;
  onScaleChange: (scale: TimelineScale) => void;
  onAnchorDateChange: (date: Date) => void;
  onGoalClick?: (goal: Goal) => void;
  onGoalTimelineChange: (
    goalId: string,
    updates: Partial<Pick<Goal, 'targetDate' | 'progress' | 'status' | 'completedAt'>>
  ) => Promise<boolean>;
  onMilestoneTimelineChange: (
    goalId: string,
    milestoneId: string,
    updates: Partial<Milestone>
  ) => Promise<boolean>;
  onMilestoneCreate: (
    goalId: string,
    milestone: {
      title: string;
      startDate: Date;
      targetDate: Date;
    }
  ) => Promise<boolean>;
}

interface PendingMilestoneDraft {
  goalId: string;
  goalTitle: string;
  startDate: Date;
  targetDate: Date;
}

const milestoneStatusStyles: Record<
  MilestoneState,
  {
    backgroundColor: string;
    backgroundSelectedColor: string;
    progressColor: string;
    progressSelectedColor: string;
  }
> = {
  'not-started': {
    backgroundColor: '#94a3b8',
    backgroundSelectedColor: '#64748b',
    progressColor: '#94a3b8',
    progressSelectedColor: '#64748b',
  },
  'in-progress': {
    backgroundColor: '#3b82f6',
    backgroundSelectedColor: '#2563eb',
    progressColor: '#60a5fa',
    progressSelectedColor: '#3b82f6',
  },
  completed: {
    backgroundColor: '#10b981',
    backgroundSelectedColor: '#059669',
    progressColor: '#34d399',
    progressSelectedColor: '#10b981',
  },
};

function addToDate(date: Date, quantity: number, scale: 'year' | 'month' | 'day' | 'hour') {
  return new Date(
    date.getFullYear() + (scale === 'year' ? quantity : 0),
    date.getMonth() + (scale === 'month' ? quantity : 0),
    date.getDate() + (scale === 'day' ? quantity : 0),
    date.getHours() + (scale === 'hour' ? quantity : 0),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  );
}

function startOfDate(date: Date, scale: 'year' | 'month' | 'day' | 'hour') {
  const scaleRank = {
    hour: 0,
    day: 1,
    month: 2,
    year: 3,
  } satisfies Record<'hour' | 'day' | 'month' | 'year', number>;
  const maxScore = scaleRank[scale];
  const shouldReset = (candidate: 'hour' | 'day' | 'month' | 'year') =>
    scaleRank[candidate] <= maxScore;

  return new Date(
    date.getFullYear(),
    shouldReset('year') ? 0 : date.getMonth(),
    shouldReset('month') ? 1 : date.getDate(),
    shouldReset('day') ? 0 : date.getHours(),
    0,
    0,
    0
  );
}

function getMonday(date: Date) {
  const clonedDate = new Date(date);
  const day = clonedDate.getDay();
  const diff = clonedDate.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(clonedDate.setDate(diff));
}

function getTimelineDates(tasks: Task[], viewMode: ViewMode, preStepsCount = 1) {
  let startDate = tasks[0].start;
  let endDate = tasks[0].start;

  for (const task of tasks) {
    if (task.start < startDate) startDate = task.start;
    if (task.end > endDate) endDate = task.end;
  }

  switch (viewMode) {
    case ViewMode.Month:
      startDate = addToDate(startDate, -preStepsCount, 'month');
      startDate = startOfDate(startDate, 'month');
      endDate = addToDate(endDate, 1, 'year');
      endDate = startOfDate(endDate, 'year');
      break;
    case ViewMode.Week:
      startDate = startOfDate(startDate, 'day');
      startDate = addToDate(getMonday(startDate), -7 * preStepsCount, 'day');
      endDate = startOfDate(endDate, 'day');
      endDate = addToDate(endDate, 45, 'day');
      break;
    case ViewMode.Day:
      startDate = startOfDate(startDate, 'day');
      startDate = addToDate(startDate, -preStepsCount, 'day');
      endDate = startOfDate(endDate, 'day');
      endDate = addToDate(endDate, 19, 'day');
      break;
    default:
      break;
  }

  const dates = [new Date(startDate)];
  let cursor = new Date(startDate);

  while (cursor < endDate) {
    cursor =
      viewMode === ViewMode.Month
        ? addToDate(cursor, 1, 'month')
        : viewMode === ViewMode.Week
          ? addToDate(cursor, 7, 'day')
          : addToDate(cursor, 1, 'day');
    dates.push(new Date(cursor));
  }

  return dates;
}

function deriveGoalStatus(goal: Goal): GoalStatus {
  if (goal.status === 'abandoned') return 'abandoned';
  if (goal.status === 'completed' || goal.progress >= 100) return 'completed';
  const completedMilestones = (goal.milestones || []).filter(
    (milestone) => milestone.completed
  ).length;
  if (goal.progress > 0 || completedMilestones > 0) return 'in-progress';
  return 'not-started';
}

function deriveMilestoneStatus(milestone: Milestone): MilestoneState {
  if (milestone.completed) return 'completed';
  if (milestone.status === 'in-progress') return 'in-progress';
  if (milestone.startDate && new Date(milestone.startDate) <= new Date()) return 'in-progress';
  return 'not-started';
}

function getScaleConfig(scale: TimelineScale) {
  switch (scale) {
    case 'day':
      return {
        viewMode: ViewMode.Day,
        columnWidth: 72,
        navigate: (date: Date, dir: 'prev' | 'next') =>
          dir === 'next' ? addDays(date, 1) : subDays(date, 1),
        viewDate: (date: Date) => date,
      };
    case 'week':
      return {
        viewMode: ViewMode.Week,
        columnWidth: 90,
        navigate: (date: Date, dir: 'prev' | 'next') =>
          dir === 'next' ? addWeeks(date, 1) : subWeeks(date, 1),
        viewDate: (date: Date) => date,
      };
    case 'month':
      return {
        viewMode: ViewMode.Month,
        columnWidth: 120,
        navigate: (date: Date, dir: 'prev' | 'next') =>
          dir === 'next' ? addMonths(date, 1) : subMonths(date, 1),
        viewDate: (date: Date) => date,
      };
    case 'quarter':
      return {
        viewMode: ViewMode.Month,
        columnWidth: 120,
        navigate: (date: Date, dir: 'prev' | 'next') =>
          dir === 'next' ? addQuarters(date, 1) : subQuarters(date, 1),
        viewDate: (date: Date) => startOfQuarter(date),
      };
  }
}

export function navigateTimelineDate(date: Date, scale: TimelineScale, dir: 'prev' | 'next') {
  switch (scale) {
    case 'day':
      return dir === 'next' ? addDays(date, 1) : addDays(date, -1);
    case 'week':
      return dir === 'next' ? addDays(date, 7) : addDays(date, -7);
    case 'month':
      return dir === 'next' ? addMonths(date, 1) : addMonths(date, -1);
    case 'quarter':
      return dir === 'next' ? addMonths(date, 3) : addMonths(date, -3);
  }
}

function buildTasks(goals: Goal[], collapsedGoalIds: Set<string>): Task[] {
  const tasks: Task[] = [];

  goals.forEach((goal, index) => {
    const goalStatus = deriveGoalStatus(goal);
    const goalStart = new Date(goal.createdAt);
    const goalEnd = goal.completedAt
      ? new Date(goal.completedAt)
      : goal.targetDate
        ? new Date(goal.targetDate)
        : addDays(goalStart, 7);

    tasks.push({
      id: `goal:${goal.id}`,
      name: goal.title,
      start: goalStart,
      end: goalEnd < goalStart ? goalStart : goalEnd,
      type: 'project',
      progress: Math.round(goal.progress),
      isDisabled: true,
      hideChildren: collapsedGoalIds.has(goal.id),
      displayOrder: index * 100,
      styles: {
        backgroundColor:
          goalStatus === 'completed'
            ? '#10b981'
            : goalStatus === 'in-progress'
              ? '#4f46e5'
              : goalStatus === 'abandoned'
                ? '#f59e0b'
                : '#94a3b8',
        backgroundSelectedColor:
          goalStatus === 'completed'
            ? '#059669'
            : goalStatus === 'in-progress'
              ? '#4338ca'
              : goalStatus === 'abandoned'
                ? '#d97706'
                : '#64748b',
        progressColor:
          goalStatus === 'completed'
            ? '#34d399'
            : goalStatus === 'in-progress'
              ? '#818cf8'
              : goalStatus === 'abandoned'
                ? '#fbbf24'
                : '#cbd5e1',
        progressSelectedColor:
          goalStatus === 'completed'
            ? '#10b981'
            : goalStatus === 'in-progress'
              ? '#6366f1'
              : goalStatus === 'abandoned'
                ? '#f59e0b'
                : '#94a3b8',
      },
    });

    const milestones = goal.milestones || [];
    milestones.forEach((milestone, milestoneIndex) => {
      const status = deriveMilestoneStatus(milestone);
      const styles = milestoneStatusStyles[status];
      const start = new Date(milestone.startDate || goal.createdAt);
      const end = new Date(
        milestone.completedAt || milestone.targetDate || milestone.startDate || goal.createdAt
      );

      tasks.push({
        id: `milestone:${goal.id}:${milestone.id}`,
        name: milestone.title,
        start,
        end: end < start ? start : end,
        type: 'task',
        progress: milestone.completed ? 100 : status === 'in-progress' ? 50 : 0,
        project: `goal:${goal.id}`,
        displayOrder: index * 100 + milestoneIndex + 1,
        styles,
      });
    });
  });

  return tasks;
}

export function GoalsRoadmapTimeline({
  goals,
  scale,
  anchorDate,
  columnWidths,
  onColumnWidthsChange,
  onGoalClick,
  onGoalTimelineChange,
  onMilestoneTimelineChange,
  onMilestoneCreate,
}: GoalsRoadmapTimelineProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<PendingMilestoneDraft | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);
  const [collapsedGoalIds, setCollapsedGoalIds] = useState<string[]>([]);
  const [chartScrollLeft, setChartScrollLeft] = useState(0);
  const hasInitializedCollapseRef = useRef(false);
  const previousGoalIdsRef = useRef<string[]>([]);
  const ganttWrapperRef = useRef<HTMLDivElement | null>(null);
  const suppressEmptyClickRef = useRef(false);
  const suppressTaskClickRef = useRef(false);
  const scaleConfig = getScaleConfig(scale);
  const resizeStateRef = useRef<{
    key: keyof TimelineColumnWidths;
    startX: number;
    startWidth: number;
  } | null>(null);

  const collapsedGoalIdSet = useMemo(() => new Set(collapsedGoalIds), [collapsedGoalIds]);
  const tasks = useMemo(() => buildTasks(goals, collapsedGoalIdSet), [goals, collapsedGoalIdSet]);
  const timelineDates = useMemo(
    () => getTimelineDates(tasks, scaleConfig.viewMode, 1),
    [tasks, scaleConfig.viewMode]
  );
  const taskListWidthValue = columnWidths.activity + columnWidths.from + columnWidths.to + 32;
  const taskListWidth = `${taskListWidthValue}px`;
  const todayLineLeft = useMemo(() => {
    if (timelineDates.length < 2) return null;

    const now = new Date();
    for (let index = 0; index < timelineDates.length - 1; index += 1) {
      const start = timelineDates[index].getTime();
      const end = timelineDates[index + 1].getTime();

      if (now.getTime() >= start && now.getTime() < end) {
        const ratio = (now.getTime() - start) / Math.max(1, end - start);
        return taskListWidthValue + (index + ratio) * scaleConfig.columnWidth - chartScrollLeft;
      }
    }

    return null;
  }, [chartScrollLeft, scaleConfig.columnWidth, taskListWidthValue, timelineDates]);

  const beginResize = (key: keyof TimelineColumnWidths, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    resizeStateRef.current = {
      key,
      startX: event.clientX,
      startWidth: columnWidths[key],
    };
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!resizeStateRef.current) return;

      const { key, startX, startWidth } = resizeStateRef.current;
      const deltaX = event.clientX - startX;
      const minWidths: TimelineColumnWidths = { activity: 140, from: 64, to: 64 };
      const maxWidths: TimelineColumnWidths = { activity: 560, from: 220, to: 220 };
      const nextWidth = Math.max(minWidths[key], Math.min(maxWidths[key], startWidth + deltaX));

      onColumnWidthsChange({
        ...columnWidths,
        [key]: nextWidth,
      });
    };

    const handleMouseUp = () => {
      resizeStateRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [columnWidths, onColumnWidthsChange]);

  const CompactTaskListHeader: NonNullable<StylingOption['TaskListHeader']> = ({
    headerHeight,
    fontFamily,
    fontSize,
  }) => (
    <div
      style={{
        height: headerHeight,
        fontFamily,
        fontSize,
        display: 'grid',
        gridTemplateColumns: `${columnWidths.activity}px ${columnWidths.from}px ${columnWidths.to}px`,
      }}
      className="items-center border-b border-slate-200 bg-slate-50 px-4 dark:border-slate-800 dark:bg-slate-950"
    >
      {(
        [
          ['activity', 'Actividad', 'text-left'],
          ['from', 'From', 'text-center'],
          ['to', 'To', 'text-center'],
        ] as const
      ).map(([key, label, align]) => (
        <div key={key} className={cn('relative min-w-0', align)}>
          <span className="block truncate text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {label}
          </span>
          <span
            onMouseDown={(event) => beginResize(key, event)}
            className="absolute right-[-8px] top-1/2 h-6 w-4 -translate-y-1/2 cursor-col-resize rounded bg-transparent after:absolute after:left-1/2 after:top-0 after:h-full after:w-px after:-translate-x-1/2 after:bg-slate-300 hover:after:bg-indigo-500 dark:after:bg-slate-700"
          />
        </div>
      ))}
    </div>
  );

  const CompactTaskListTable: NonNullable<StylingOption['TaskListTable']> = ({
    rowHeight,
    fontFamily,
    fontSize,
    tasks,
    selectedTaskId,
    setSelectedTask,
    onExpanderClick,
  }) => (
    <div style={{ fontFamily, fontSize }}>
      {tasks.map((task) => {
        const isProject = task.type === 'project';
        const isSelected = selectedTaskId === task.id;
        const indent = isProject ? 0 : 18;
        const expanderSymbol = isProject ? (task.hideChildren ? '▶' : '▼') : '';

        return (
          <button
            key={task.id}
            type="button"
            onClick={() => {
              setSelectedTask(task.id);

              if (isProject) {
                onExpanderClick(task);
              }
            }}
            className={cn(
              'w-full items-center border-b border-slate-100 px-4 text-left transition-colors dark:border-slate-900',
              isSelected
                ? 'bg-indigo-50 dark:bg-indigo-950/20'
                : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-950'
            )}
            style={{
              height: rowHeight,
              display: 'grid',
              gridTemplateColumns: `${columnWidths.activity}px ${columnWidths.from}px ${columnWidths.to}px`,
            }}
          >
            <span
              className="flex min-w-0 items-center gap-1.5 pr-2"
              style={{ paddingLeft: indent }}
            >
              {isProject ? (
                <span
                  onClick={(event) => {
                    event.stopPropagation();
                    onExpanderClick(task);
                  }}
                  className="inline-flex h-4 w-4 items-center justify-center rounded text-[10px] font-black text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  {expanderSymbol}
                </span>
              ) : (
                <span className="w-4" />
              )}
              <span
                className={cn(
                  'truncate',
                  isProject
                    ? 'text-base font-black text-slate-900 dark:text-slate-50'
                    : 'text-sm font-semibold text-slate-700 dark:text-slate-300'
                )}
              >
                {task.name}
              </span>
            </span>
            <span className="text-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {format(task.start, 'dd/MM/yyyy')}
            </span>
            <span className="text-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {format(task.end, 'dd/MM/yyyy')}
            </span>
          </button>
        );
      })}
    </div>
  );

  useEffect(() => {
    const goalIds = goals.map((goal) => goal.id);

    setCollapsedGoalIds((current) => {
      if (!hasInitializedCollapseRef.current) {
        hasInitializedCollapseRef.current = true;
        previousGoalIdsRef.current = goalIds;
        return goalIds;
      }

      const currentSet = new Set(current);
      const previousGoalIdSet = new Set(previousGoalIdsRef.current);
      const next = goalIds.filter(
        (goalId) => currentSet.has(goalId) || !previousGoalIdSet.has(goalId)
      );
      previousGoalIdsRef.current = goalIds;

      return next;
    });
  }, [goals]);

  const handleDateChange = async (task: Task) => {
    suppressTaskClickRef.current = true;
    window.setTimeout(() => {
      suppressTaskClickRef.current = false;
    }, 200);

    if (task.id.startsWith('goal:')) {
      const goalId = task.id.replace('goal:', '');
      return onGoalTimelineChange(goalId, {
        targetDate: task.end,
      });
    }

    const [, goalId, milestoneId] = task.id.split(':');
    return onMilestoneTimelineChange(goalId, milestoneId, {
      startDate: task.start,
      targetDate: task.end,
      status: task.progress >= 100 ? 'completed' : 'in-progress',
      completed: task.progress >= 100,
      completedAt: task.progress >= 100 ? task.end : undefined,
    });
  };

  const handleProgressChange = async (task: Task) => {
    suppressTaskClickRef.current = true;
    window.setTimeout(() => {
      suppressTaskClickRef.current = false;
    }, 200);

    if (task.id.startsWith('goal:')) {
      const goalId = task.id.replace('goal:', '');
      return onGoalTimelineChange(goalId, {
        progress: task.progress,
        status:
          task.progress >= 100 ? 'completed' : task.progress > 0 ? 'in-progress' : 'not-started',
        completedAt: task.progress >= 100 ? task.end : null,
      });
    }

    const [, goalId, milestoneId] = task.id.split(':');
    const completed = task.progress >= 100;
    return onMilestoneTimelineChange(goalId, milestoneId, {
      completed,
      completedAt: completed ? task.end : undefined,
      status: completed ? 'completed' : task.progress > 0 ? 'in-progress' : 'not-started',
    });
  };

  useEffect(() => {
    const wrapper = ganttWrapperRef.current;
    if (!wrapper || tasks.length === 0 || timelineDates.length < 2) {
      return;
    }

    const svgElements = Array.from(wrapper.querySelectorAll('svg'));
    const chartSvg = svgElements.find((svg) => Number(svg.getAttribute('height') || 0) > 120);
    if (!chartSvg) {
      return;
    }

    const handleEmptyTimelineClick = (event: MouseEvent) => {
      if (suppressEmptyClickRef.current) {
        suppressEmptyClickRef.current = false;
        return;
      }

      const target = event.target as Element | null;
      if (!target) return;

      if (target.closest('g[tabindex="0"]')) {
        return;
      }

      const point = chartSvg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;

      const matrix = chartSvg.getScreenCTM();
      if (!matrix) return;

      const cursor = point.matrixTransform(matrix.inverse());
      if (cursor.x < 0 || cursor.y < 0) {
        return;
      }

      const rowIndex = Math.floor(cursor.y / 52);
      const rowTask = tasks[rowIndex];
      if (!rowTask) {
        return;
      }

      const goalTask = rowTask.id.startsWith('goal:')
        ? rowTask
        : tasks.find((task) => task.id === rowTask.project);

      if (!goalTask) {
        return;
      }

      const goalId = goalTask.id.replace('goal:', '');
      const goal = goals.find((item) => item.id === goalId);
      if (!goal) {
        return;
      }

      const dateIndex = Math.max(
        0,
        Math.min(Math.floor(cursor.x / scaleConfig.columnWidth), timelineDates.length - 2)
      );
      const startDate = new Date(timelineDates[dateIndex]);
      const nextDate = new Date(timelineDates[dateIndex + 1]);
      const targetDate = new Date(nextDate.getTime() - 1);

      setPendingDraft({
        goalId,
        goalTitle: goal.title,
        startDate,
        targetDate: targetDate >= startDate ? targetDate : startDate,
      });
      setNewMilestoneTitle('');
    };

    chartSvg.addEventListener('click', handleEmptyTimelineClick);

    return () => {
      chartSvg.removeEventListener('click', handleEmptyTimelineClick);
    };
  }, [goals, scaleConfig.columnWidth, tasks, timelineDates]);

  useEffect(() => {
    const wrapper = ganttWrapperRef.current;
    if (!wrapper) return;

    const scrollContainer = Array.from(wrapper.querySelectorAll('div')).find(
      (element) => element.scrollWidth > element.clientWidth + 8
    );

    if (!scrollContainer) return;
    setChartScrollLeft(scrollContainer.scrollLeft);

    let isPanning = false;
    let lastClientX = 0;
    let dragDistance = 0;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;
      if (
        target.closest('g[tabindex="0"]') ||
        target.closest('button') ||
        target.closest('input')
      ) {
        return;
      }

      isPanning = true;
      lastClientX = event.clientX;
      dragDistance = 0;
      wrapper.classList.add('cursor-grabbing');
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isPanning) return;

      const deltaX = event.clientX - lastClientX;
      dragDistance += Math.abs(deltaX);
      scrollContainer.scrollLeft -= deltaX;
      lastClientX = event.clientX;
    };

    const handleScroll = () => {
      setChartScrollLeft(scrollContainer.scrollLeft);
    };

    const stopPanning = () => {
      if (dragDistance > 4) {
        suppressEmptyClickRef.current = true;
      }

      isPanning = false;
      wrapper.classList.remove('cursor-grabbing');
    };

    wrapper.addEventListener('mousedown', handleMouseDown);
    scrollContainer.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopPanning);

    return () => {
      wrapper.removeEventListener('mousedown', handleMouseDown);
      scrollContainer.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopPanning);
    };
  }, [tasks]);

  const handleCreateMilestone = async () => {
    if (!pendingDraft || !newMilestoneTitle.trim()) {
      return;
    }

    setIsCreatingMilestone(true);
    try {
      const success = await onMilestoneCreate(pendingDraft.goalId, {
        title: newMilestoneTitle.trim(),
        startDate: pendingDraft.startDate,
        targetDate: pendingDraft.targetDate,
      });

      if (success) {
        setPendingDraft(null);
        setNewMilestoneTitle('');
      }
    } finally {
      setIsCreatingMilestone(false);
    }
  };

  if (goals.length === 0) {
    return (
      <div className="rounded-[2rem] border border-slate-100 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CalendarRange className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No hay objetivos para construir el cronograma.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={ganttWrapperRef}
        className="relative cursor-grab overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        {todayLineLeft !== null && (
          <div
            className="pointer-events-none absolute inset-y-0 z-20"
            style={{ left: `${todayLineLeft}px` }}
          >
            <div className="h-full w-px bg-rose-500/80 dark:bg-rose-400/80" />
          </div>
        )}
        <Gantt
          tasks={tasks}
          viewMode={scaleConfig.viewMode}
          viewDate={scaleConfig.viewDate(anchorDate)}
          onDateChange={handleDateChange}
          onProgressChange={handleProgressChange}
          onClick={(task) => {
            if (suppressTaskClickRef.current) {
              return;
            }

            setSelectedTaskId(task.id);
            if (task.id.startsWith('goal:')) {
              const goalId = task.id.replace('goal:', '');
              const goal = goals.find((item) => item.id === goalId);
              if (goal) onGoalClick?.(goal);
            }
            if (task.id.startsWith('milestone:')) {
              const [, goalId] = task.id.split(':');
              const goal = goals.find((item) => item.id === goalId);
              if (goal) onGoalClick?.(goal);
            }
          }}
          onDoubleClick={(task) => {
            if (task.id.startsWith('goal:')) {
              const goalId = task.id.replace('goal:', '');
              const goal = goals.find((item) => item.id === goalId);
              if (goal) onGoalClick?.(goal);
            }
          }}
          onSelect={(task, isSelected) => {
            setSelectedTaskId(isSelected ? task.id : null);
          }}
          locale="es"
          columnWidth={scaleConfig.columnWidth}
          rowHeight={52}
          headerHeight={56}
          listCellWidth={taskListWidth}
          barFill={72}
          barCornerRadius={8}
          handleWidth={10}
          todayColor="transparent"
          fontFamily="var(--font-geist-sans), sans-serif"
          fontSize="12px"
          ganttHeight={640}
          TooltipContent={EmptyTooltip}
          TaskListHeader={CompactTaskListHeader}
          TaskListTable={CompactTaskListTable}
          onExpanderClick={(task) => {
            if (!task.id.startsWith('goal:')) return;
            const goalId = task.id.replace('goal:', '');
            setCollapsedGoalIds((current) => {
              const currentSet = new Set(current);

              if (task.hideChildren) {
                currentSet.add(goalId);
              } else {
                currentSet.delete(goalId);
              }

              return goals
                .map((goal) => goal.id)
                .filter((goalItemId) => currentSet.has(goalItemId));
            });
          }}
        />
      </div>

      <div className="rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {selectedTaskId
            ? `Seleccionado: ${selectedTaskId}`
            : 'Selecciona una barra para abrir la meta. Arrastrar horizontal cambia fechas; arrastrar progreso actualiza estado. Click en un espacio vacío crea un nuevo hito para esa meta.'}
        </p>
      </div>

      <Dialog
        open={Boolean(pendingDraft)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDraft(null);
            setNewMilestoneTitle('');
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Hito</DialogTitle>
            <DialogDescription>
              {pendingDraft
                ? `Crear un nuevo hito dentro de "${pendingDraft.goalTitle}".`
                : 'Crear un nuevo hito.'}
            </DialogDescription>
          </DialogHeader>

          {pendingDraft && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timeline-milestone-title">Título</Label>
                <Input
                  id="timeline-milestone-title"
                  value={newMilestoneTitle}
                  onChange={(event) => setNewMilestoneTitle(event.target.value)}
                  placeholder="Ej: Completar módulo 2"
                  autoFocus
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Inicio</Label>
                  <Input
                    type="date"
                    value={format(pendingDraft.startDate, 'yyyy-MM-dd')}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (!value) return;
                      setPendingDraft((current) =>
                        current
                          ? {
                              ...current,
                              startDate: new Date(`${value}T00:00:00`),
                            }
                          : current
                      );
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fin</Label>
                  <Input
                    type="date"
                    value={format(pendingDraft.targetDate, 'yyyy-MM-dd')}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (!value) return;
                      setPendingDraft((current) =>
                        current
                          ? {
                              ...current,
                              targetDate: new Date(`${value}T23:59:59`),
                            }
                          : current
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPendingDraft(null);
                setNewMilestoneTitle('');
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void handleCreateMilestone()}
              disabled={!newMilestoneTitle.trim() || isCreatingMilestone}
            >
              Crear hito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
