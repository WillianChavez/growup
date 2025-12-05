'use client';

import { motion } from 'framer-motion';
import { MoreVertical, Pencil, Trash2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Book } from '@/types/book.types';
import { cn } from '@/lib/utils';

interface BookCardProps {
  book: Book;
  index: number;
  onEdit: (book: Book) => void;
  onDelete: (bookId: string) => void;
}

const statusColors: Record<string, string> = {
  'to-read': 'bg-slate-100 text-slate-700 dark:bg-slate-950',
  reading: 'bg-blue-100 text-blue-700 dark:bg-blue-950',
  completed: 'bg-green-100 text-green-700 dark:bg-green-950',
  abandoned: 'bg-orange-100 text-orange-700 dark:bg-orange-950',
};

const statusLabels: Record<string, string> = {
  'to-read': 'Por Leer',
  reading: 'Leyendo',
  completed: 'Completado',
  abandoned: 'Abandonado',
};

export function BookCard({ book, index, onEdit, onDelete }: BookCardProps) {
  const progress = (book.currentPage / book.pages) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="group hover:shadow-lg transition-all overflow-hidden">
        <CardHeader className="pb-3 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg truncate">{book.title}</CardTitle>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">
                {book.author}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(book)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(book.id)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] sm:text-xs text-slate-500">
              <span>
                {book.currentPage} / {book.pages} páginas
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5 sm:h-2" />
          </div>

          {/* Status and Genre */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Badge className={cn(statusColors[book.status], 'text-[10px] sm:text-xs')}>
              {statusLabels[book.status]}
            </Badge>
            {book.genre && (
              <span className="text-[10px] sm:text-xs text-slate-500 truncate max-w-[120px] sm:max-w-none">
                {book.genre}
              </span>
            )}
          </div>

          {/* Rating */}
          {book.rating && (
            <div className="flex items-center gap-0.5 sm:gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-3 w-3 sm:h-4 sm:w-4',
                    i < book.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                  )}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
