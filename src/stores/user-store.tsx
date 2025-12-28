'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { UserWithoutPassword } from '@/types/auth.types';
import type { ApiResponse } from '@/types/api.types';

interface UserStoreContextType {
  user: UserWithoutPassword | null;
  isLoading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  updateUser: (userData: UserWithoutPassword) => void;
  clearUser: () => void;
}

const UserStoreContext = createContext<UserStoreContextType | undefined>(undefined);

interface UserStoreProviderProps {
  children: ReactNode;
}

export function UserStoreProvider({ children }: UserStoreProviderProps) {
  const [user, setUser] = useState<UserWithoutPassword | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/me');
      const data = (await response.json()) as ApiResponse<UserWithoutPassword>;
      if (data.success && data.data) {
        setUser(data.data);
      } else {
        setUser(null);
        if (data.error) {
          setError(data.error);
        }
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setUser(null);
      setError('Error al obtener el usuario');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUser = useCallback((userData: UserWithoutPassword) => {
    setUser(userData);
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  // Cargar usuario al montar el provider
  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  return (
    <UserStoreContext.Provider
      value={{
        user,
        isLoading,
        error,
        fetchUser,
        updateUser,
        clearUser,
      }}
    >
      {children}
    </UserStoreContext.Provider>
  );
}

export function useUserStore(): UserStoreContextType {
  const context = useContext(UserStoreContext);
  if (context === undefined) {
    throw new Error('useUserStore must be used within a UserStoreProvider');
  }
  return context;
}
