'use client';

import { useState, useEffect } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBooks } from '@/hooks/useBooks';
import { BookDialog } from '@/components/books/book-dialog';
import { BookCard } from '@/components/books/book-card';
import type { Book, BookFormData, BookStatus } from '@/types/book.types';

export default function ReadingPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<BookStatus>('reading');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | undefined>();
  const { fetchBooks, createBook, updateBook, deleteBook, isLoading } = useBooks();

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    const data = await fetchBooks();
    setBooks(data);
  };

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
    await loadBooks();
  };

  const handleDeleteBook = async (bookId: string) => {
    if (confirm('¿Estás seguro de eliminar este libro?')) {
      await deleteBook(bookId);
      await loadBooks();
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
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 w-full sm:w-auto text-sm"
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
            <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.completedThisYear}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium">Leyendo Ahora</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-4">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.currentlyReading}</div>
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
        <TabsList>
          <TabsTrigger value="reading">Leyendo</TabsTrigger>
          <TabsTrigger value="to-read">Por Leer</TabsTrigger>
          <TabsTrigger value="completed">Completados</TabsTrigger>
          <TabsTrigger value="abandoned">Abandonados</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-48" />
                </Card>
              ))
            ) : filteredBooks.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-slate-400 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    No hay libros en esta categoría
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Agrega tu primer libro
                  </p>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Libro
                  </Button>
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

      {/* Dialog */}
      <BookDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingBook(undefined);
        }}
        book={editingBook}
        onSave={handleSaveBook}
      />
    </div>
  );
}
