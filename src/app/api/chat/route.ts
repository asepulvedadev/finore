import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateEmbedding } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Messages array required' }, { status: 400 });
    }

    const userMessage = messages[messages.length - 1]?.content;

    if (!userMessage) {
      return Response.json({ error: 'User message required' }, { status: 400 });
    }

    // Buscar contexto relevante en la base de datos
    let context = '';
    let dataSummary = '';
    let chunks: any[] = [];

    try {
      // Buscar chunks directamente en la tabla (sin función RPC por ahora)
      const { data: chunkData, error: searchError } = await supabaseAdmin
        .from('document_chunks')
        .select('content, metadata')
        .limit(50) // Aumentar límite para obtener más datos
        .order('id', { ascending: false }); // Obtener los más recientes primero

      chunks = chunkData || [];

      // Si no hay chunks, intentar obtener datos del CSV directamente
      if (chunks.length === 0) {
        console.log('No chunks found, fetching CSV data directly...');
        try {
          const csvResponse = await fetch(process.env.NEXT_PUBLIC_CSV_URL || '');
          const csvText = await csvResponse.text();
          // Crear un chunk con los primeros 1000 caracteres del CSV
          chunks = [{
            content: `Datos del Excel financiero (primeros 1000 caracteres): ${csvText.substring(0, 1000)}...`,
            metadata: { source: 'csv_fallback', type: 'raw_data' }
          }];
        } catch (csvError) {
          console.error('Error fetching CSV fallback:', csvError);
        }
      }

      if (searchError) {
        console.error('Error fetching chunks:', searchError);
        context = 'Error al acceder a la base de datos de chunks.';
      } else if (chunks && chunks.length > 0) {
        // Tomar una muestra representativa de los datos
        const sampleChunks = chunks.slice(0, 10);
        context = sampleChunks.map((chunk: any) => chunk.content).join('\n\n');

        // Crear resumen de datos disponibles
        dataSummary = `Datos disponibles: ${chunks.length} registros de Excel con información de créditos, sucursales, montos y fechas.`;
      } else {
        context = 'No hay datos indexados disponibles en la base de datos.';
        dataSummary = 'No hay datos disponibles para análisis.';
      }
    } catch (error) {
      console.error('Error accessing database:', error);
      context = 'Error al acceder a la información.';
      dataSummary = 'Error en la base de datos.';
    }

    // Crear el prompt del sistema más directo y enfocado
    const systemPrompt = `Eres Ferb, asistente de análisis financiero de Finore.

DATOS DISPONIBLES: ${dataSummary}

CONTEXTO DE DATOS:
${context}

INSTRUCCIONES CRÍTICAS:
- TODAS las preguntas sobre Excel, datos, números, sucursales, créditos, montos, fechas SON preguntas válidas sobre datos financieros
- NUNCA digas "No tengo información" si hay datos disponibles - busca en todo el contexto proporcionado
- Las sucursales incluyen TODOS los estados: Tamaulipas, Nuevo León, Chihuahua, Durango, Coahuila, etc.
- Para preguntas sobre sucursales específicas: busca en TODOS los datos, no solo menciones algunas
- Responde DIRECTAMENTE con números específicos y análisis basado en los datos reales
- Si preguntan por una sucursal específica: proporciona estadísticas concretas de esa sucursal
- Si no encuentras datos exactos: di "Según los datos disponibles..." y proporciona información similar
- Solo rechaza preguntas completamente ajenas a finanzas/datos (como "qué tiempo hace")
- Responde en español, sé específico con números y porcentajes

Pregunta del usuario: ${userMessage}`;

    console.log('Iniciando generación de respuesta con IA...');

    try {
      // Generar respuesta con Gemini usando Vercel AI SDK (con timeout)
      const result = await Promise.race([
        generateText({
          model: google('gemini-2.0-flash-lite'),
          system: systemPrompt,
          prompt: userMessage,
          temperature: 0.7,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 30000)
        )
      ]) as Awaited<ReturnType<typeof generateText>>;

      console.log('Respuesta generada exitosamente:', result.text.substring(0, 100) + '...');

      return Response.json({
        content: result.text,
        contextUsed: chunks?.length || 0
      });
    } catch (aiError) {
      console.error('Error en la generación de IA:', aiError);

      // Respuesta de fallback si falla la IA
      return Response.json({
        content: `Lo siento, tuve un problema técnico al procesar tu pregunta. Los datos muestran que hay ${chunks?.length || 0} registros disponibles. ¿Puedes reformular tu pregunta sobre los datos del Excel?`,
        contextUsed: chunks?.length || 0,
        error: true
      });
    }

  } catch (error) {
    console.error('Error in chat API:', error);
    return Response.json(
      { error: `Error interno del servidor: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
