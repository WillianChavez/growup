'use client';

import { useState } from 'react';
import type { Book, BookFormData } from '@/types/book.types';

export function useBooks() {
  const [isLoading, setIsLoading] = useState(false);

  const fetchBooks = async (): Promise<Book[]> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/books');
      if (!response.ok) throw new Error('Failed to fetch books');
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching books:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createBook = async (data: BookFormData): Promise<Book | null> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create book');
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Error creating book:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBook = async (id: string, data: Partial<BookFormData>): Promise<Book | null> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/books/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update book');
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Error updating book:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBook = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/books/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting book:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchBooks,
    createBook,
    updateBook,
    deleteBook,
    isLoading,
  };
}
