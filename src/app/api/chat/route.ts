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

    // Buscar contexto relevante en la base de datos vectorial
    let context = '';
    let relevantChunks: any[] = [];

    try {
      const queryEmbedding = await generateEmbedding(userMessage);

      const { data: chunks, error: searchError } = await supabaseAdmin.rpc(
        'match_document_chunks',
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.1,
          match_count: 10
        }
      );

      if (searchError) {
        console.error('Error searching chunks:', searchError);
        context = 'Error al buscar información en la base de datos.';
      } else if (chunks && chunks.length > 0) {
        relevantChunks = chunks;
        context = chunks.map((chunk: any) => chunk.content).join('\n\n');
      } else {
        context = 'No se encontró información relevante en la base de datos para esta consulta.';
      }
    } catch (embeddingError) {
      console.error('Error generating embedding for search:', embeddingError);
      context = 'Error al procesar la consulta de búsqueda.';
    }

    // Crear el prompt del sistema para análisis financiero
    const systemPrompt = `Eres Ferb, un asistente de IA especializado ÚNICAMENTE en análisis de datos financieros del Excel de Finore. Tu nombre viene de Phineas y Ferb.

INFORMACIÓN DISPONIBLE:
${context}

INSTRUCCIONES ESTRICTAS:
- SOLO responde preguntas relacionadas con los datos del Excel financiero
- SI la pregunta NO está relacionada con datos financieros o Excel, di: "Lo siento, solo puedo ayudarte con análisis de datos financieros del Excel."
- Realiza cálculos, porcentajes y análisis estadístico cuando sea solicitado
- Da ideas para mejorar métricas financieras basadas en los datos
- Compara sucursales, tendencias y desempeño
- Siempre responde en español
- Sé específico con números y porcentajes cuando los tengas
- Si no hay suficiente información, dilo claramente
- Tu personalidad es inteligente, útil y un poco juguetona como Ferb

Pregunta del usuario: ${userMessage}`;

    // Generar respuesta con Gemini usando Vercel AI SDK
    const result = await generateText({
      model: google('gemini-2.0-flash-lite'),
      system: systemPrompt,
      prompt: userMessage,
      temperature: 0.7,
    });

    return Response.json({
      content: result.text,
      contextUsed: relevantChunks?.length || 0
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return Response.json(
      { error: `Error interno del servidor: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
