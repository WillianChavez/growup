export interface Book {
  id: string;
  userId: string;
  title: string;
  author: string;
  pages: number;
  currentPage: number;
  isbn: string | null;
  coverUrl: string | null;
  status: BookStatus;
  rating: number | null;
  review: string | null;
  notes: string | null;
  startDate: Date | null;
  endDate: Date | null;
  genre: string | null;
  tags: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookQuote {
  id: string;
  bookId: string;
  userId: string;
  quote: string;
  pageNumber: number | null;
  isFavorite: boolean;
  createdAt: Date;
}

export type BookStatus = 'reading' | 'completed' | 'to-read' | 'abandoned';

export interface BookFormData {
  title: string;
  author: string;
  pages: number;
  currentPage?: number;
  isbn?: string;
  coverUrl?: string;
  status: BookStatus;
  rating?: number;
  review?: string;
  notes?: string;
  startDate?: Date;
  endDate?: Date;
  genre?: string;
  tags?: string[];
}

export interface BookWithQuotes extends Book {
  quotes: BookQuote[];
}

export interface ReadingStats {
  totalBooks: number;
  completedBooks: number;
  currentlyReading: number;
  pagesRead: number;
  booksThisYear: number;
  booksThisMonth: number;
  averageRating: number;
  favoriteGenres: { genre: string; count: number }[];
  readingGoalProgress: number;
}
