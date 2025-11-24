'use client';

import { useState } from 'react';
import type { UserWithoutPassword, LoginCredentials, RegisterData } from '@/types/auth.types';
import type { ApiResponse, ErrorResponse } from '@/types/api.types';

interface UseAuthResult {
  user: UserWithoutPassword | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<UserWithoutPassword | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Error al iniciar sesión');
        return false;
      }

      if (data.data?.user) {
        setUser(data.data.user);
      }

      return true;
    } catch (err) {
      setError('Error de conexión');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!responseData.success) {
        setError(responseData.error || 'Error al registrarse');
        return false;
      }

      if (responseData.data?.user) {
        setUser(responseData.data.user);
      }

      return true;
    } catch (err) {
      setError('Error de conexión');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      setUser(null);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
  };
}

