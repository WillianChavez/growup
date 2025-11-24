'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Book, BookFormData, BookStatus } from '@/types/book.types';

interface BookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book?: Book;
  onSave: (data: BookFormData) => Promise<void>;
}

const STATUSES: { value: BookStatus; label: string }[] = [
  { value: 'to-read', label: 'Por Leer' },
  { value: 'reading', label: 'Leyendo' },
  { value: 'completed', label: 'Completado' },
  { value: 'abandoned', label: 'Abandonado' },
];

export function BookDialog({ open, onOpenChange, book, onSave }: BookDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    pages: 0,
    currentPage: 0,
    status: 'to-read',
    coverUrl: undefined,
    rating: undefined,
    notes: undefined,
    genre: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  // Actualizar formData cuando cambie el libro o se abra el diálogo
  useEffect(() => {
    if (open) {
      setFormData({
        title: book?.title || '',
        author: book?.author || '',
        pages: book?.pages || 0,
        currentPage: book?.currentPage || 0,
        status: book?.status || 'to-read',
        coverUrl: book?.coverUrl || undefined,
        rating: book?.rating || undefined,
        notes: book?.notes || undefined,
        genre: book?.genre || undefined,
        startDate: book?.startDate || undefined,
        endDate: book?.endDate || undefined,
      });
    }
  }, [open, book]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving book:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{book ? 'Editar Libro' : 'Nuevo Libro'}</DialogTitle>
          <DialogDescription>
            {book ? 'Modifica los detalles del libro' : 'Añade un nuevo libro a tu biblioteca'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: El Principito"
              required
            />
          </div>

          {/* Author */}
          <div className="space-y-2">
            <Label htmlFor="author">Autor *</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              placeholder="Ej: Antoine de Saint-Exupéry"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Total Pages */}
            <div className="space-y-2">
              <Label htmlFor="pages">Total de Páginas *</Label>
              <Input
                id="pages"
                type="number"
                min="1"
                value={formData.pages}
                onChange={(e) => setFormData({ ...formData, pages: parseInt(e.target.value) })}
                required
              />
            </div>

            {/* Current Page */}
            <div className="space-y-2">
              <Label htmlFor="currentPage">Página Actual</Label>
              <Input
                id="currentPage"
                type="number"
                min="0"
                max={formData.pages}
                value={formData.currentPage || 0}
                onChange={(e) => setFormData({ ...formData, currentPage: parseInt(e.target.value) })}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: BookStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Genre */}
          <div className="space-y-2">
            <Label htmlFor="genre">Género</Label>
            <Input
              id="genre"
              value={formData.genre || ''}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value || undefined })}
              placeholder="Ej: Ficción, No ficción, Biografía..."
            />
          </div>

          {/* Cover URL */}
          <div className="space-y-2">
            <Label htmlFor="coverUrl">URL de Portada</Label>
            <Input
              id="coverUrl"
              type="url"
              value={formData.coverUrl || ''}
              onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value || undefined })}
              placeholder="https://..."
            />
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label htmlFor="rating">Calificación (1-5)</Label>
            <Input
              id="rating"
              type="number"
              min="1"
              max="5"
              step="0.5"
              value={formData.rating || ''}
              onChange={(e) => setFormData({ ...formData, rating: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value || undefined })}
              placeholder="Reflexiones, citas favoritas, aprendizajes..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {book ? 'Guardar Cambios' : 'Agregar Libro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

