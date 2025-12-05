import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const importData = await request.json();

    // Validar estructura del archivo
    if (!importData.data || !importData.version) {
      return NextResponse.json({ error: 'Formato de archivo inválido' }, { status: 400 });
    }

    const { data } = importData;

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
              userId: payload.userId,
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
              userId: payload.userId,
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
                userId: payload.userId,
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
                userId: payload.userId,
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
              userId: payload.userId,
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
                userId: payload.userId,
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
                userId: payload.userId,
                name: 'Sin categoría',
              },
            });

            if (defaultCategory) {
              finalCategoryId = defaultCategory.id;
            } else {
              const newDefaultCategory = await tx.transactionCategory.create({
                data: {
                  userId: payload.userId,
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
              userId: payload.userId,
              amount: transaction.amount,
              description: transaction.description,
              type: transaction.type,
              date: new Date(transaction.date),
              categoryId: finalCategoryId,
              notes: transaction.notes,
              isRecurring: transaction.isRecurring || false,
              recurringFrequency: transaction.recurringFrequency,
              tags: transaction.tags,
            },
          });
        }
      }

      // Importar metas
      if (data.goals?.length) {
        for (const goal of data.goals) {
          await tx.goal.create({
            data: {
              userId: payload.userId,
              title: goal.title,
              description: goal.description,
              category: goal.category || 'personal',
              priority: goal.priority || 'medium',
              targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
              status: goal.status,
              progress: goal.progress,
              milestones: goal.milestones,
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
              userId: payload.userId,
              name: source.name,
              amount: source.amount,
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
              userId: payload.userId,
              name: expense.name,
              amount: expense.amount,
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
              userId: payload.userId,
              name: asset.name,
              value: asset.value,
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
              userId: payload.userId,
              creditor: debt.creditor,
              totalAmount: debt.totalAmount,
              remainingAmount: debt.remainingAmount,
              monthlyPayment: debt.monthlyPayment,
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

    return NextResponse.json({
      success: true,
      message: 'Datos importados exitosamente',
    });
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json({ error: 'Error al importar datos' }, { status: 500 });
  }
}
