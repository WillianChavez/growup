import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import type { Book, BookQuote, ReadingStats } from '@/types/book.types';
import { getYearRange, getMonthRange } from '@/lib/date-utils';

export class BookService {
  static async create(
    userId: string,
    data: Omit<Book, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<Book> {
    return prisma.book.create({
      data: {
        ...data,
        userId,
        tags: data.tags ? JSON.stringify(data.tags) : null,
      },
    }) as Promise<Book>;
  }

  static async findById(id: string, userId: string): Promise<Book | null> {
    const book = await prisma.book.findFirst({
      where: { id, userId },
    });

    if (!book) return null;

    return {
      ...book,
      tags: book.tags ? JSON.parse(book.tags) : null,
    } as Book;
  }

  static async findAllByUser(userId: string, status?: string): Promise<Book[]> {
    const where: Prisma.BookWhereInput = { userId };

    if (status) {
      where.status = status;
    }

    const books = await prisma.book.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return books.map((book) => ({
      ...book,
      tags: book.tags ? JSON.parse(book.tags) : null,
    })) as Book[];
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

    const updated = await prisma.book.update({
      where: { id },
      data: {
        ...data,
        tags: data.tags ? JSON.stringify(data.tags) : undefined,
      },
    });

    return {
      ...updated,
      tags: updated.tags ? JSON.parse(updated.tags) : null,
    } as Book;
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
    });

    return {
      ...updated,
      tags: updated.tags ? JSON.parse(updated.tags) : null,
    } as Book;
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
