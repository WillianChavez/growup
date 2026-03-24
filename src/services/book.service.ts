import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import type { Book, BookQuote, ReadingStats } from '@/types/book.types';
import { getYearRange, getMonthRange } from '@/lib/date-utils';
import { normalizeTagNames } from '@/lib/entity-tags';

type BookRecord = Prisma.BookGetPayload<{
  include: {
    tags: {
      orderBy: {
        order: 'asc';
      };
    };
  };
}>;

function mapBookRecord(book: BookRecord): Book {
  return {
    ...book,
    tags: book.tags.map((tag) => tag.name),
  } as Book;
}

export class BookService {
  static async create(
    userId: string,
    data: Omit<Book, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<Book> {
    const tags = normalizeTagNames(data.tags);

    const book = await prisma.book.create({
      data: {
        ...data,
        userId,
        tags: tags.length
          ? {
              create: tags.map((name, index) => ({
                name,
                order: index,
              })),
            }
          : undefined,
      },
      include: {
        tags: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return mapBookRecord(book);
  }

  static async findById(id: string, userId: string): Promise<Book | null> {
    const book = await prisma.book.findFirst({
      where: { id, userId },
      include: {
        tags: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!book) return null;

    return mapBookRecord(book);
  }

  static async findAllByUser(userId: string, status?: string): Promise<Book[]> {
    const where: Prisma.BookWhereInput = { userId };

    if (status) {
      where.status = status;
    }

    const books = await prisma.book.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        tags: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return books.map(mapBookRecord);
  }

  static async update(
    id: string,
    userId: string,
    data: Partial<Omit<Book, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Book | null> {
    const book = await prisma.book.findFirst({
      where: { id, userId },
    });

    if (!book) return null;

    const tags = data.tags !== undefined ? normalizeTagNames(data.tags) : null;

    const updated = await prisma.book.update({
      where: { id },
      data: {
        ...data,
        tags:
          tags !== null
            ? {
                deleteMany: {},
                ...(tags.length
                  ? {
                      create: tags.map((name, index) => ({
                        name,
                        order: index,
                      })),
                    }
                  : {}),
              }
            : undefined,
      },
      include: {
        tags: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return mapBookRecord(updated);
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      await prisma.book.deleteMany({
        where: { id, userId },
      });
      return true;
    } catch {
      return false;
    }
  }

  static async updateProgress(
    id: string,
    userId: string,
    currentPage: number
  ): Promise<Book | null> {
    const book = await prisma.book.findFirst({
      where: { id, userId },
    });

    if (!book) return null;

    const isCompleted = currentPage >= book.pages && book.status !== 'completed';

    const updated = await prisma.book.update({
      where: { id },
      data: {
        currentPage,
        status: isCompleted ? 'completed' : book.status,
        endDate: isCompleted ? new Date() : book.endDate,
      },
      include: {
        tags: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return mapBookRecord(updated);
  }

  // Quotes
  static async createQuote(
    userId: string,
    data: Omit<BookQuote, 'id' | 'userId' | 'createdAt'>
  ): Promise<BookQuote> {
    return prisma.bookQuote.create({
      data: {
        ...data,
        userId,
      },
    }) as Promise<BookQuote>;
  }

  static async getQuotes(bookId: string, userId: string): Promise<BookQuote[]> {
    return prisma.bookQuote.findMany({
      where: { bookId, userId },
      orderBy: { createdAt: 'desc' },
    }) as Promise<BookQuote[]>;
  }

  static async deleteQuote(id: string, userId: string): Promise<boolean> {
    try {
      await prisma.bookQuote.deleteMany({
        where: { id, userId },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Statistics
  static async getStats(userId: string): Promise<ReadingStats> {
    const allBooks = await prisma.book.findMany({
      where: { userId },
    });

    const yearRange = getYearRange();
    const monthRange = getMonthRange();

    const completedBooks = allBooks.filter((b) => b.status === 'completed');
    const currentlyReading = allBooks.filter((b) => b.status === 'reading');

    const booksThisYear = completedBooks.filter(
      (b) => b.endDate && b.endDate >= yearRange.start && b.endDate <= yearRange.end
    );

    const booksThisMonth = completedBooks.filter(
      (b) => b.endDate && b.endDate >= monthRange.start && b.endDate <= monthRange.end
    );

    const pagesRead = completedBooks.reduce((sum, book) => sum + book.pages, 0);

    const booksWithRating = completedBooks.filter((b) => b.rating !== null);
    const averageRating =
      booksWithRating.length > 0
        ? booksWithRating.reduce((sum, book) => sum + (book.rating || 0), 0) /
          booksWithRating.length
        : 0;

    // Genre statistics
    const genreCounts: Record<string, number> = {};
    allBooks.forEach((book) => {
      if (book.genre) {
        genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
      }
    });

    const favoriteGenres = Object.entries(genreCounts)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const yearlyGoal = 24; // TODO: Make this configurable per user
    const readingGoalProgress = yearlyGoal > 0 ? (booksThisYear.length / yearlyGoal) * 100 : 0;

    return {
      totalBooks: allBooks.length,
      completedBooks: completedBooks.length,
      currentlyReading: currentlyReading.length,
      pagesRead,
      booksThisYear: booksThisYear.length,
      booksThisMonth: booksThisMonth.length,
      averageRating: Math.round(averageRating * 10) / 10,
      favoriteGenres,
      readingGoalProgress: Math.min(Math.round(readingGoalProgress), 100),
    };
  }
}
