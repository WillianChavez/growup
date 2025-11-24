import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { User, UserWithoutPassword } from '@/types/auth.types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function excludePassword(user: User): UserWithoutPassword {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
