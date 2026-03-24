import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiResponse } from '@/types/api.types';
import type { UserWithoutPassword } from '@/types/auth.types';
import { getRequestAuth } from '@/lib/api-auth';
import { logError } from '@/lib/logger';
import { parseUserSettings } from '@/lib/user-settings';
import { prisma } from '@/lib/db';

const preferencesSchema = z.object({
  reading: z
    .object({
      viewMode: z.enum(['list', 'board']).optional(),
      activeTab: z.enum(['reading', 'completed', 'to-read', 'abandoned']).optional(),
    })
    .partial()
    .optional(),
  goals: z
    .object({
      viewMode: z.enum(['list', 'board', 'accordion', 'timeline']).optional(),
      activeFilter: z.enum(['todos', 'proceso', 'logrados', 'pausados']).optional(),
      activeBoardColumn: z
        .enum(['not-started', 'in-progress', 'completed', 'abandoned'])
        .optional(),
      timelineColumns: z
        .object({
          activity: z.number().int().min(120).max(520),
          from: z.number().int().min(56).max(220),
          to: z.number().int().min(56).max(220),
        })
        .optional(),
    })
    .partial()
    .optional(),
});

export async function PATCH(request: NextRequest) {
  const route = '/api/auth/preferences';
  const method = 'PATCH';

  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = preferencesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: auth.payload.userId },
      select: { settings: true },
    });

    if (!currentUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const currentSettings = parseUserSettings(currentUser.settings);
    const nextSettings = {
      ...currentSettings,
      ...validation.data,
      reading: {
        ...(currentSettings.reading ?? {}),
        ...(validation.data.reading ?? {}),
      },
      goals: {
        ...(currentSettings.goals ?? {}),
        ...(validation.data.goals ?? {}),
      },
    };

    const user = await prisma.user.update({
      where: { id: auth.payload.userId },
      data: { settings: JSON.stringify(nextSettings) },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        timezone: true,
        currency: true,
        theme: true,
        settings: true,
      },
    });

    return NextResponse.json<ApiResponse<UserWithoutPassword>>({
      success: true,
      message: 'Preferencias actualizadas exitosamente',
      data: user,
    });
  } catch (error) {
    logError('Unhandled error in preferences route', {
      error,
      route,
      method,
    });

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al actualizar preferencias' },
      { status: 500 }
    );
  }
}
