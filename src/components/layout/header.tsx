'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUserStore } from '@/stores/user-store';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { user, clearUser } = useUserStore();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      clearUser();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-950">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-6 w-6" />
      </Button>

      <div className="h-6 w-px bg-slate-200 lg:hidden dark:bg-slate-800" />

      <div className="flex flex-1 gap-x-2 self-stretch sm:gap-x-4 lg:gap-x-6">
        <div className="flex flex-1 items-center min-w-0">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate"
          >
            <span className="hidden sm:inline">Bienvenido de vuelta, </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {user?.name || 'Usuario'}
            </span>
          </motion.p>
        </div>

        <div className="flex items-center gap-x-2 sm:gap-x-4 lg:gap-x-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative flex items-center gap-2 h-9 px-2 sm:px-4">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                  <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white text-xs sm:text-sm">
                    {user ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium lg:block">
                  {user?.name || 'Usuario'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
