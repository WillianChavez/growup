import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types/api.types';
import { getRequestAuth } from '@/lib/api-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { importPayloadSchema } from '@/lib/validations/import.validation';
import { logError, logWarn } from '@/lib/logger';
import { normalizeMoney } from '@/lib/money';

export async function POST(request: NextRequest) {
  const route = '/api/data/import';
  const method = 'POST';

  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const rateLimit = checkRateLimit('data:import', auth.payload.userId || auth.ip, {
      windowMs: 10 * 60 * 1000,
      maxRequests: 5,
    });

    if (!rateLimit.allowed) {
      logWarn('Rate limit exceeded for import endpoint', {
        route,
        method,
        userId: auth.payload.userId,
        ip: auth.ip,
      });

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Demasiadas importaciones en poco tiempo. Intenta nuevamente más tarde.',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const contentLengthHeader = request.headers.get('content-length');
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;
    const maxImportPayloadBytes = 2 * 1024 * 1024;
    if (contentLength > maxImportPayloadBytes) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Archivo demasiado grande. Máximo permitido: 2MB',
        },
        { status: 413 }
      );
    }

    const importDataRaw = await request.json();

    const validation = importPayloadSchema.safeParse(importDataRaw);
    if (!validation.success) {
      logWarn('Import payload validation failed', {
        route,
        method,
        userId: auth.payload.userId,
        ip: auth.ip,
        details: {
          firstIssue: validation.error.issues[0]?.message || 'unknown_validation_error',
        },
      });

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: validation.error.issues[0]?.message || 'Formato de importación inválido',
        },
        { status: 400 }
      );
    }

    const { data } = validation.data;
    const userId = auth.payload.userId;

    // Importar datos en transacción (agregar, no eliminar)
    await prisma.$transaction(async (tx) => {
      // Mapas para rastrear IDs antiguos -> nuevos IDs
      const categoryIdMap = new Map<string, string>();
      const habitIdMap = new Map<string, string>();
      const bookIdMap = new Map<string, string>();
      const transactionCategoryIdMap = new Map<string, string>();

      // Importar categorías de hábitos y mapear IDs
      if (data.habitCategories?.length) {
        for (const category of data.habitCategories) {
          const oldId = category.id;
          const newCategory = await tx.habitCategory.create({
            data: {
              userId: userId,
              name: category.name,
              emoji: category.emoji,
              color: category.color,
            },
          });
          categoryIdMap.set(oldId, newCategory.id);
        }
      }

      // Importar categorías de transacciones y mapear IDs
      if (data.transactionCategories?.length) {
        for (const category of data.transactionCategories) {
          const oldId = category.id;
          const newCategory = await tx.transactionCategory.create({
            data: {
              userId: userId,
              name: category.name,
              emoji: category.emoji,
              type: category.type,
              color: category.color,
            },
          });
          transactionCategoryIdMap.set(oldId, newCategory.id);
        }
      }

      // Importar hábitos y mapear IDs
      if (data.habits?.length) {
        for (const habit of data.habits) {
          const oldId = habit.id;
          const newCategoryId = categoryIdMap.get(habit.categoryId);
          if (newCategoryId) {
            const newHabit = await tx.habit.create({
              data: {
                userId: userId,
                title: habit.title,
                description: habit.description,
                emoji: habit.emoji,
                categoryId: newCategoryId,
                isActive: habit.isActive,
                isArchived: habit.isArchived,
              },
            });
            habitIdMap.set(oldId, newHabit.id);
          }
        }
      }

      // Importar entradas de hábitos
      if (data.habitEntries?.length) {
        for (const entry of data.habitEntries) {
          const newHabitId = habitIdMap.get(entry.habitId);
          if (newHabitId) {
            await tx.habitEntry.create({
              data: {
                userId: userId,
                habitId: newHabitId,
                date: new Date(entry.date),
                completed: entry.completed,
                notes: entry.notes,
                completedAt: entry.completedAt ? new Date(entry.completedAt) : null,
              },
            });
          }
        }
      }

      // Importar libros y mapear IDs
      if (data.books?.length) {
        for (const book of data.books) {
          const oldId = book.id;
          const newBook = await tx.book.create({
            data: {
              userId: userId,
              title: book.title,
              author: book.author,
              pages: book.pages,
              currentPage: book.currentPage,
              status: book.status,
              rating: book.rating,
              review: book.review,
              notes: book.notes,
              isbn: book.isbn,
              coverUrl: book.coverUrl,
              genre: book.genre,
              startDate: book.startDate ? new Date(book.startDate) : null,
              endDate: book.endDate ? new Date(book.endDate) : null,
              tags: book.tags?.length
                ? {
                    create: book.tags.map((name, index) => ({
                      name,
                      order: index,
                    })),
                  }
                : undefined,
            },
          });
          bookIdMap.set(oldId, newBook.id);
        }
      }

      // Importar citas de libros
      if (data.bookQuotes?.length) {
        for (const quote of data.bookQuotes) {
          const newBookId = bookIdMap.get(quote.bookId);
          if (newBookId) {
            await tx.bookQuote.create({
              data: {
                userId: userId,
                bookId: newBookId,
                quote: quote.quote,
                pageNumber: quote.pageNumber,
                isFavorite: quote.isFavorite || false,
              },
            });
          }
        }
      }

      // Importar transacciones
      if (data.transactions?.length) {
        for (const transaction of data.transactions) {
          const newCategoryId = transaction.categoryId
            ? transactionCategoryIdMap.get(transaction.categoryId)
            : null;

          // Si no hay categoría mapeada, crear una categoría "Sin categoría" si no existe
          let finalCategoryId = newCategoryId;
          if (!finalCategoryId) {
            const defaultCategory = await tx.transactionCategory.findFirst({
              where: {
                userId: userId,
                name: 'Sin categoría',
              },
            });

            if (defaultCategory) {
              finalCategoryId = defaultCategory.id;
            } else {
              const newDefaultCategory = await tx.transactionCategory.create({
                data: {
                  userId: userId,
                  name: 'Sin categoría',
                  emoji: '📦',
                  type: 'both',
                  color: '#94a3b8',
                },
              });
              finalCategoryId = newDefaultCategory.id;
            }
          }

          await tx.transaction.create({
            data: {
              userId: userId,
              amount: normalizeMoney(transaction.amount),
              description: transaction.description,
              type: transaction.type,
              date: new Date(transaction.date),
              categoryId: finalCategoryId,
              notes: transaction.notes,
              isRecurring: transaction.isRecurring || false,
              recurringFrequency: transaction.recurringFrequency,
              tags: transaction.tags?.length
                ? {
                    create: transaction.tags.map((name, index) => ({
                      name,
                      order: index,
                    })),
                  }
                : undefined,
            },
          });
        }
      }

      // Importar metas
      if (data.goals?.length) {
        for (const goal of data.goals) {
          await tx.goal.create({
            data: {
              userId: userId,
              title: goal.title,
              description: goal.description,
              category: goal.category || 'personal',
              priority: goal.priority || 'medium',
              targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
              status: goal.status,
              progress: goal.progress,
              milestones: goal.milestones?.length
                ? {
                    create: goal.milestones.map((milestone, index) => ({
                      id: milestone.id,
                      title: milestone.title,
                      completed: milestone.completed,
                      status:
                        milestone.status || (milestone.completed ? 'completed' : 'not-started'),
                      startDate: milestone.startDate ? new Date(milestone.startDate) : null,
                      targetDate: milestone.targetDate ? new Date(milestone.targetDate) : null,
                      completedAt: milestone.completedAt ? new Date(milestone.completedAt) : null,
                      order: index,
                    })),
                  }
                : undefined,
              completedAt: goal.completedAt ? new Date(goal.completedAt) : null,
            },
          });
        }
      }

      // Importar fuentes de ingreso
      if (data.incomeSources?.length) {
        for (const source of data.incomeSources) {
          await tx.incomeSource.create({
            data: {
              userId: userId,
              name: source.name,
              amount: normalizeMoney(source.amount),
              frequency: source.frequency,
              category: source.category,
              isPrimary: source.isPrimary,
              description: source.description,
              isActive: source.isActive,
              startDate: new Date(source.startDate),
              endDate: source.endDate ? new Date(source.endDate) : null,
            },
          });
        }
      }

      // Importar gastos recurrentes
      if (data.recurringExpenses?.length) {
        for (const expense of data.recurringExpenses) {
          await tx.recurringExpense.create({
            data: {
              userId: userId,
              name: expense.name,
              amount: normalizeMoney(expense.amount),
              frequency: expense.frequency,
              category: expense.category,
              dueDay: expense.dueDay,
              description: expense.description,
              isActive: expense.isActive,
              isEssential: expense.isEssential,
              startDate: new Date(expense.startDate),
              endDate: expense.endDate ? new Date(expense.endDate) : null,
              lastPaid: expense.lastPaid ? new Date(expense.lastPaid) : null,
            },
          });
        }
      }

      // Importar activos
      if (data.assets?.length) {
        for (const asset of data.assets) {
          await tx.asset.create({
            data: {
              userId: userId,
              name: asset.name,
              value: normalizeMoney(asset.value),
              type: asset.type,
              category: asset.category,
              description: asset.description,
              isActive: asset.isActive,
              purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate) : null,
            },
          });
        }
      }

      // Importar deudas
      if (data.debts?.length) {
        for (const debt of data.debts) {
          await tx.debt.create({
            data: {
              userId: userId,
              creditor: debt.creditor,
              totalAmount: normalizeMoney(debt.totalAmount),
              remainingAmount: normalizeMoney(debt.remainingAmount),
              monthlyPayment: normalizeMoney(debt.monthlyPayment),
              annualRate: debt.annualRate,
              type: debt.type,
              description: debt.description,
              status: debt.status,
              startDate: new Date(debt.startDate),
              endDate: debt.endDate ? new Date(debt.endDate) : null,
              paidDate: debt.paidDate ? new Date(debt.paidDate) : null,
            },
          });
        }
      }
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Datos importados exitosamente',
    });
  } catch (error) {
    logError('Unhandled error in import route', {
      error,
      route,
      method,
    });

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al importar datos' },
      { status: 500 }
    );
  }
}
