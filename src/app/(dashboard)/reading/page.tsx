'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Minus,
  MoreVertical,
  CheckCircle2,
  Flame,
  Bookmark,
  Star,
  Library,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBooks } from '@/hooks/useBooks';
import { BookDialog } from '@/components/books/book-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import type { Book, BookFormData, BookStatus } from '@/types/book.types';
import { cn } from '@/lib/utils';

interface BookCardItemProps {
  book: Book;
  progress: number;
  onUpdatePage: (bookId: string, delta: number) => void;
  onPageInput: (bookId: string, value: string) => void;
  onEdit: (book: Book) => void;
}

const BookCardItem = memo(
  ({ book, progress, onUpdatePage, onPageInput, onEdit }: BookCardItemProps) => {
    const [imageError, setImageError] = useState(false);
    const [localPage, setLocalPage] = useState(() => book.currentPage.toString());

    return (
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-50 dark:border-slate-800 flex flex-col md:flex-row gap-6 sm:gap-8 group hover:shadow-2xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden">
        {/* Portada con Badge de Progreso */}
        <div className="relative w-full md:w-40 h-60 shrink-0">
          <div className="w-full h-full rounded-4xl overflow-hidden shadow-2xl relative z-10">
            {book.coverUrl && !imageError ? (
              <Image
                src={book.coverUrl}
                alt={book.title}
                fill
                className="object-cover"
                unoptimized
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-slate-400 dark:text-slate-600" />
              </div>
            )}
          </div>
          <div className="absolute -bottom-3 -right-3 z-20 bg-white dark:bg-slate-900 p-2 rounded-4xl shadow-xl border border-slate-100 dark:border-slate-800">
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs',
                progress === 100
                  ? 'bg-emerald-500 text-white'
                  : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
              )}
            >
              {progress}%
            </div>
          </div>
        </div>

        {/* Contenido e Inteligencia de Actualización */}
        <div className="flex-1 flex flex-col justify-between py-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white leading-tight tracking-tight mb-1">
                {book.title}
              </h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 font-bold">{book.author}</p>
            </div>
            <button
              onClick={() => onEdit(book)}
              className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400"
            >
              <MoreVertical size={20} />
            </button>
          </div>

          {/* CONTROLES INTELIGENTES */}
          {book.status === 'reading' && (
            <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onUpdatePage(book.id, -1)}
                    className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 dark:hover:text-rose-400 transition-all active:scale-90"
                  >
                    <Minus size={18} strokeWidth={3} />
                  </button>

                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      value={localPage}
                      onChange={(e) => {
                        setLocalPage(e.target.value);
                      }}
                      onBlur={(e) => {
                        onPageInput(book.id, e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onPageInput(book.id, localPage);
                          e.currentTarget.blur();
                        }
                      }}
                      min="0"
                      max={book.pages}
                      className="w-16 text-center font-black text-xl sm:text-2xl text-slate-800 dark:text-white bg-transparent border-none focus:ring-0 p-0"
                    />
                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                      Pág. Actual
                    </span>
                  </div>

                  <button
                    onClick={() => onUpdatePage(book.id, 1)}
                    className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all active:scale-90"
                  >
                    <Plus size={18} strokeWidth={3} />
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-tighter uppercase">
                    Total
                  </p>
                  <p className="text-lg font-black text-slate-800 dark:text-white leading-none">
                    {book.pages}
                  </p>
                </div>
              </div>

              {/* Barra de Progreso Dinámica */}
              <div className="relative pt-2">
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1">
                  <div
                    className="h-full bg-indigo-500 dark:bg-indigo-600 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Info para libros no en lectura */}
          {book.status !== 'reading' && (
            <div className="mt-6 sm:mt-8 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {book.status === 'completed'
                    ? 'Completado'
                    : book.status === 'to-read'
                      ? 'Por Leer'
                      : 'Abandonado'}
                </span>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                  {book.pages} páginas
                </span>
              </div>
              {book.genre && (
                <p className="text-xs text-slate-400 dark:text-slate-500">{book.genre}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

BookCardItem.displayName = 'BookCardItem';

export default function ReadingPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<BookStatus>('reading');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const { fetchBooks, createBook, updateBook, deleteBook, isLoading } = useBooks();

  useEffect(() => {
    const loadBooks = async () => {
      const data = await fetchBooks();
      setBooks(data);
    };
    void loadBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenDialog = (book?: Book) => {
    setEditingBook(book);
    setDialogOpen(true);
  };

  const handleSaveBook = useCallback(
    async (data: BookFormData) => {
      if (editingBook) {
        const updated = await updateBook(editingBook.id, data);
        if (updated) {
          // Actualizar solo el libro editado
          setBooks((prevBooks) => prevBooks.map((b) => (b.id === editingBook.id ? updated : b)));
        }
      } else {
        const created = await createBook(data);
        if (created) {
          // Agregar el nuevo libro al estado
          setBooks((prevBooks) => [...prevBooks, created]);
        }
      }
    },
    [editingBook, updateBook, createBook]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (bookToDelete) {
      const success = await deleteBook(bookToDelete);
      if (success) {
        // Eliminar solo el libro eliminado del estado
        setBooks((prevBooks) => prevBooks.filter((b) => b.id !== bookToDelete));
        setBookToDelete(null);
      }
    }
  }, [bookToDelete, deleteBook]);

  const updatePage = useCallback(
    async (bookId: string, delta: number) => {
      let previousPage = 0;
      let maxPages = 0;

      // Actualización optimista: actualizar el estado local inmediatamente
      setBooks((prevBooks) => {
        const book = prevBooks.find((b) => b.id === bookId);
        if (!book) return prevBooks;

        previousPage = book.currentPage;
        maxPages = book.pages;
        const newPage = Math.min(Math.max(0, book.currentPage + delta), book.pages);

        return prevBooks.map((b) => (b.id === bookId ? { ...b, currentPage: newPage } : b));
      });

      // Actualizar en el backend (sin recargar toda la lista)
      try {
        const newPage = Math.min(Math.max(0, previousPage + delta), maxPages);
        await updateBook(bookId, { currentPage: newPage });
      } catch (error) {
        // Si falla, revertir el cambio
        setBooks((prevBooks) =>
          prevBooks.map((b) => (b.id === bookId ? { ...b, currentPage: previousPage } : b))
        );
        console.error('Error updating page:', error);
      }
    },
    [updateBook]
  );

  const handlePageInput = useCallback(
    async (bookId: string, value: string) => {
      let previousPage = 0;
      let maxPages = 0;
      const num = parseInt(value) || 0;

      // Actualización optimista: actualizar el estado local inmediatamente
      setBooks((prevBooks) => {
        const book = prevBooks.find((b) => b.id === bookId);
        if (!book) return prevBooks;

        previousPage = book.currentPage;
        maxPages = book.pages;
        const newPage = Math.min(Math.max(0, num), book.pages);

        return prevBooks.map((b) => (b.id === bookId ? { ...b, currentPage: newPage } : b));
      });

      // Actualizar en el backend (sin recargar toda la lista)
      try {
        const newPage = Math.min(Math.max(0, num), maxPages);
        await updateBook(bookId, { currentPage: newPage });
      } catch (error) {
        // Si falla, revertir el cambio
        setBooks((prevBooks) =>
          prevBooks.map((b) => (b.id === bookId ? { ...b, currentPage: previousPage } : b))
        );
        console.error('Error updating page:', error);
      }
    },
    [updateBook]
  );

  const getProgress = (current: number, total: number) => Math.round((current / total) * 100);

  // Calculate stats
  const stats = useMemo(() => {
    const currentlyReading = books.filter((b) => b.status === 'reading').length;
    const completedThisYear = books.filter((b) => {
      if (b.status !== 'completed' || !b.endDate) return false;
      const endDate = new Date(b.endDate);
      const currentYear = new Date().getFullYear();
      return endDate.getFullYear() === currentYear;
    }).length;
    const toRead = books.filter((b) => b.status === 'to-read').length;
    const pagesRead = books.reduce((sum, book) => sum + book.currentPage, 0);

    // Calcular días de racha (simplificado - se puede mejorar)
    const readingBooks = books.filter((b) => b.status === 'reading');
    const streakDays = readingBooks.length > 0 ? 8 : 0; // Placeholder

    return {
      currentlyReading,
      completedThisYear,
      toRead,
      pagesRead,
      streakDays,
    };
  }, [books]);

  // Filtrar libros por búsqueda y tab activo
  const filteredBooks = useMemo(() => {
    let filtered = books.filter((book) => book.status === activeTab);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          (book.genre && book.genre.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [books, activeTab, searchQuery]);

  const tabLabels: Record<BookStatus, string> = {
    reading: 'leyendo',
    'to-read': 'por leer',
    completed: 'completados',
    abandoned: 'abandonados',
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Library size={18} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400">
              GrowUp Reader
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Mi Biblioteca
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium mt-1">
            Registra y organiza tus lecturas
          </p>
        </div>

        <button
          onClick={() => handleOpenDialog()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 dark:shadow-indigo-900/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 w-full md:w-auto"
        >
          <Plus size={18} strokeWidth={3} /> NUEVO LIBRO
        </button>
      </header>

      {/* Contenido */}
      <div className="space-y-6 lg:space-y-8">
        {/* RESUMEN DE ACTIVIDAD */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: 'Leyendo',
              val: String(stats.currentlyReading),
              icon: Flame,
              color: 'text-orange-500 dark:text-orange-400',
              bg: 'bg-orange-50 dark:bg-orange-900/20',
            },
            {
              label: 'Meta 2024',
              val: `${stats.completedThisYear}/20`,
              icon: Star,
              color: 'text-yellow-500 dark:text-yellow-400',
              bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            },
            {
              label: 'Días Racha',
              val: String(stats.streakDays),
              icon: CheckCircle2,
              color: 'text-emerald-500 dark:text-emerald-400',
              bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            },
            {
              label: 'Por Leer',
              val: String(stats.toRead),
              icon: Bookmark,
              color: 'text-indigo-500 dark:text-indigo-400',
              bg: 'bg-indigo-50 dark:bg-indigo-900/20',
            },
          ].map((s, i) => {
            const IconComponent = s.icon;
            return (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 sm:p-5 rounded-4xl shadow-sm flex items-center gap-3 sm:gap-4"
              >
                <div
                  className={cn(
                    'w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0',
                    s.bg,
                    s.color
                  )}
                >
                  <IconComponent size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-black text-slate-800 dark:text-white leading-none">
                    {s.val}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {s.label}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* FILTROS Y BÚSQUEDA */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto">
            {(['reading', 'to-read', 'completed'] as BookStatus[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 sm:px-6 py-2.5 rounded-xl text-xs font-black capitalize whitespace-nowrap transition-all',
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>
          <div className="relative flex-1 w-full">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar en tu biblioteca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 transition-all"
            />
          </div>
        </div>

        {/* LISTADO DE LIBROS CON CONTROLES IN-CARD */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pb-12">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-[2.5rem]" />
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 sm:p-16 text-center border border-slate-100 dark:border-slate-800">
            <div className="relative mb-6 inline-block">
              <div className="absolute inset-0 bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-2xl" />
              <BookOpen className="relative h-20 w-20 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              No hay libros en esta categoría
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {activeTab === 'reading'
                ? 'Comienza a leer y registra tu progreso. Cada página te acerca a tus objetivos.'
                : activeTab === 'to-read'
                  ? 'Crea tu lista de lectura. Planifica qué leerás a continuación.'
                  : '¡Excelente trabajo! Los libros completados aparecerán aquí.'}
            </p>
            {activeTab !== 'completed' && (
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Libro
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pb-12">
            {filteredBooks.map((book) => {
              const progress = getProgress(book.currentPage, book.pages);
              return (
                <BookCardItem
                  key={`${book.id}-${book.currentPage}`}
                  book={book}
                  progress={progress}
                  onUpdatePage={updatePage}
                  onPageInput={handlePageInput}
                  onEdit={handleOpenDialog}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <BookDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingBook(undefined);
        }}
        book={editingBook}
        onSave={handleSaveBook}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="¿Eliminar libro?"
        description="Esta acción no se puede deshacer. Se eliminará el libro y todas sus citas asociadas."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
