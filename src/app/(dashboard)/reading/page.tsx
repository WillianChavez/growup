'use client';

import { useState, useEffect } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBooks } from '@/hooks/useBooks';
import { BookDialog } from '@/components/books/book-dialog';
import { BookCard } from '@/components/books/book-card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Book, BookFormData, BookStatus } from '@/types/book.types';

export default function ReadingPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<BookStatus>('reading');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const isMobile = useIsMobile();
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

  const handleSaveBook = async (data: BookFormData) => {
    if (editingBook) {
      await updateBook(editingBook.id, data);
    } else {
      await createBook(data);
    }
    const booksData = await fetchBooks();
    setBooks(booksData);
  };

  const handleDeleteBook = (bookId: string) => {
    setBookToDelete(bookId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (bookToDelete) {
      await deleteBook(bookToDelete);
      const booksData = await fetchBooks();
      setBooks(booksData);
      setBookToDelete(null);
    }
  };

  // Calculate stats
  const stats = {
    totalBooks: books.length,
    completedThisYear: books.filter((b) => b.status === 'completed').length,
    currentlyReading: books.filter((b) => b.status === 'reading').length,
    pagesRead: books.reduce((sum, book) => sum + book.currentPage, 0),
  };

  const filteredBooks = books.filter((book) => book.status === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Mi Biblioteca
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Registra y organiza tus lecturas
          </p>
        </div>
        <Button
          className="bg-linear-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 w-full sm:w-auto text-sm hidden sm:flex"
          onClick={() => handleOpenDialog()}
        >
          <Plus className="mr-1 sm:mr-2 h-4 w-4" />
          Agregar Libro
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Total de Libros</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-4">
            <div className="text-lg sm:text-2xl font-bold">{stats.totalBooks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Completados</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-4">
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              {stats.completedThisYear}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Leyendo Ahora</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-4">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">
              {stats.currentlyReading}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Páginas Leídas</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-4">
            <div className="text-lg sm:text-2xl font-bold text-purple-600">{stats.pagesRead}</div>
          </CardContent>
        </Card>
      </div>

      {/* Books List with Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BookStatus)}>
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:grid-cols-4 lg:inline-flex">
          <TabsTrigger value="reading" className="text-xs sm:text-sm">
            Leyendo
          </TabsTrigger>
          <TabsTrigger value="to-read" className="text-xs sm:text-sm">
            Por Leer
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm">
            Completados
          </TabsTrigger>
          <TabsTrigger value="abandoned" className="text-xs sm:text-sm">
            Abandonados
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-2 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredBooks.length === 0 ? (
              <Card className="col-span-full border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="relative mb-6 inline-block">
                    <div className="absolute inset-0 bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-2xl" />
                    <BookOpen className="relative h-20 w-20 text-blue-500 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    No hay libros en esta categoría
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center max-w-md">
                    {activeTab === 'reading'
                      ? 'Comienza a leer y registra tu progreso. Cada página te acerca a tus objetivos.'
                      : activeTab === 'to-read'
                        ? 'Crea tu lista de lectura. Planifica qué leerás a continuación.'
                        : activeTab === 'completed'
                          ? '¡Excelente trabajo! Los libros completados aparecerán aquí.'
                          : 'Los libros abandonados aparecerán aquí.'}
                  </p>
                  {activeTab !== 'completed' && (
                    <Button
                      onClick={() => handleOpenDialog()}
                      className="bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Libro
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredBooks.map((book, index) => (
                <BookCard
                  key={book.id}
                  book={book}
                  index={index}
                  onEdit={handleOpenDialog}
                  onDelete={handleDeleteBook}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

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

      {/* Floating Action Button para móvil */}
      {isMobile && (
        <FloatingActionButton onClick={() => handleOpenDialog()} label="Agregar Libro" />
      )}
    </div>
  );
}
