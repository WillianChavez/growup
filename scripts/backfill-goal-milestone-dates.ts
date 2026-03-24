import { addMonths, endOfDay, startOfDay } from 'date-fns';
import { prisma } from '../src/lib/db';
import type { GoalStatus, Milestone } from '../src/types/goal.types';
import {
  normalizeGoalMilestones,
  normalizeGoalStatusFromMilestones,
} from '../src/lib/goal-milestones';

async function main() {
  const goals = await prisma.goal.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      milestones: true,
    },
  });

  let updatedGoals = 0;

  for (const goal of goals) {
    const existingRows = goal.milestones;
    const sourceMilestones: Milestone[] = existingRows.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      completed: milestone.completed,
      status: milestone.status as Exclude<GoalStatus, 'abandoned'>,
      startDate: milestone.startDate ?? undefined,
      targetDate: milestone.targetDate ?? undefined,
      completedAt: milestone.completedAt ?? undefined,
    }));

    const goalStart = startOfDay(new Date(goal.createdAt));
    const goalEnd = goal.targetDate
      ? endOfDay(new Date(goal.targetDate))
      : endOfDay(addMonths(goalStart, Math.max(1, Math.ceil(sourceMilestones.length / 4))));

    const normalizedMilestones = normalizeGoalMilestones(sourceMilestones, {
      goalStart,
      goalEnd,
      goalStatus: goal.status as GoalStatus,
      goalProgress: goal.progress,
      referenceDate: new Date(),
    });

    const normalizedProgress =
      normalizedMilestones.length > 0
        ? Math.round(
            (normalizedMilestones.filter((milestone) => milestone.completed).length /
              normalizedMilestones.length) *
              100
          )
        : goal.progress;

    const normalizedStatus = normalizeGoalStatusFromMilestones(
      goal.status as GoalStatus,
      normalizedProgress,
      normalizedMilestones
    );

    await prisma.$transaction(async (tx) => {
      await tx.goalMilestone.deleteMany({
        where: { goalId: goal.id },
      });

      if (normalizedMilestones.length > 0) {
        await tx.goalMilestone.createMany({
          data: normalizedMilestones.map((milestone, index) => ({
            id: milestone.id,
            goalId: goal.id,
            title: milestone.title,
            completed: milestone.completed,
            status: milestone.status ?? (milestone.completed ? 'completed' : 'not-started'),
            startDate: milestone.startDate ?? null,
            targetDate: milestone.targetDate ?? null,
            completedAt: milestone.completedAt ?? null,
            order: index,
          })),
        });
      }

      await tx.goal.update({
        where: { id: goal.id },
        data: {
          progress: normalizedProgress,
          status: normalizedStatus,
          completedAt:
            normalizedStatus === 'completed'
              ? goal.completedAt ||
                normalizedMilestones.at(-1)?.completedAt ||
                goal.targetDate ||
                goal.updatedAt
              : null,
        },
      });
    });

    updatedGoals++;
  }

  console.log(`Migracion completada. Metas actualizadas: ${updatedGoals}`);
}

main()
  .catch((error) => {
    console.error('Error migrando milestones a tabla:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
