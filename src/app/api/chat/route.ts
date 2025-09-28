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
        .limit(20);

      chunks = chunkData || [];

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

INSTRUCCIONES:
- TODAS las preguntas sobre Excel, datos, números, sucursales, créditos, montos, fechas, etc. SON preguntas sobre datos financieros
- Responde DIRECTAMENTE con números específicos y análisis
- Para preguntas sobre totales: suma y calcula los totales de los datos
- Para preguntas sobre cumplimiento: analiza si se cumplen metas basándote en los datos
- Para preguntas sobre sucursales: compara rendimiento y da rankings específicos
- Para preguntas sobre meses/fechas: filtra y analiza datos por periodos
- Si es pregunta sobre datos financieros: SIEMPRE responde con información específica
- Solo rechaza preguntas completamente ajenas a finanzas/datos (como "qué tiempo hace")
- Responde en español, sé específico con números y porcentajes

Pregunta: ${userMessage}`;

    // Generar respuesta con Gemini usando Vercel AI SDK
    const result = await generateText({
      model: google('gemini-2.0-flash-lite'),
      system: systemPrompt,
      prompt: userMessage,
      temperature: 0.7,
    });

    return Response.json({
      content: result.text,
      contextUsed: chunks?.length || 0
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return Response.json(
      { error: `Error interno del servidor: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
