'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CheckCircle2,
  BookOpen,
  Wallet,
  Target,
  Settings,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Hábitos', href: '/habits', icon: CheckCircle2 },
  { name: 'Lectura', href: '/reading', icon: BookOpen },
  { name: 'Finanzas', href: '/finance', icon: Wallet },
  { name: 'Objetivos', href: '/goals', icon: Target },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm lg:hidden"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-950 lg:hidden"
          >
            <div className="flex h-full flex-col gap-y-5 overflow-y-auto px-6 pb-4">
              {/* Header */}
              <div className="flex h-16 items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    GrowUp
                  </span>
                </Link>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Navigation */}
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => {
                        const isActive =
                          pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              onClick={onClose}
                              className={cn(
                                'group flex gap-x-3 rounded-lg p-3 text-sm font-semibold leading-6 transition-all',
                                isActive
                                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 dark:from-blue-950 dark:to-purple-950 dark:text-blue-400'
                                  : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-blue-400'
                              )}
                            >
                              <item.icon
                                className={cn(
                                  'h-5 w-5 shrink-0',
                                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                                )}
                                aria-hidden="true"
                              />
                              {item.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
