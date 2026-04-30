import { NextRequest, NextResponse } from 'next/server';
import { FinancialService } from '@/services/financial.service';
import { getRequestAuth } from '@/lib/api-auth';
import type { ApiResponse } from '@/types/api.types';

export async function GET(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    const payload = auth.payload;

    const assets = await FinancialService.getAssets(payload.userId);
    return NextResponse.json<ApiResponse>({ success: true, data: assets });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al obtener activos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth.isAuthenticated || !auth.payload)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    const payload = auth.payload;

    const body = await request.json();
    const asset = await FinancialService.createAsset(payload.userId, body);
    return NextResponse.json<ApiResponse>({ success: true, data: asset });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al crear activo' },
      { status: 500 }
    );
  }
}
