import { NextRequest, NextResponse } from 'next/server';
import { FinancialService } from '@/services/financial.service';
import { verifyToken } from '@/lib/jwt';
import type { ApiResponse } from '@/types/api.types';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );

    const payload = await verifyToken(token);
    if (!payload)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );

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
    const token = request.cookies.get('auth-token')?.value;
    if (!token)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );

    const payload = await verifyToken(token);
    if (!payload)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );

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
