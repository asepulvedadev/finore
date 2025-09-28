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
- Responde DIRECTAMENTE a preguntas sobre datos del Excel
- Si preguntan sobre números, porcentajes o análisis: calcula y responde con números específicos
- Si preguntan sobre sucursales: compara y da rankings
- Si preguntan sobre tendencias: analiza cambios y patrones
- Si preguntan sobre mejoras: da recomendaciones específicas basadas en datos
- Si NO es pregunta sobre datos financieros: "Solo respondo preguntas sobre datos del Excel financiero"
- Responde en español, sé conciso pero específico
- Usa los datos proporcionados para fundamentar tus respuestas

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
