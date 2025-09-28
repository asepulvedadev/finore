import { NextRequest, NextResponse } from 'next/server';
import { indexSheetData } from '@/lib/index-sheets';

export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando indexación desde API...');

    const result = await indexSheetData();

    if (result.success) {
      return NextResponse.json({
        message: 'Indexación completada exitosamente',
        chunksInserted: result.count
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error en API de indexación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}