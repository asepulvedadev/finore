import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

    // Por ahora, respuesta simple sin RAG para probar funcionalidad básica
    const systemPrompt = `Eres Ferb, un asistente de IA especializado en análisis financiero. Tu nombre viene de Phineas y Ferb.

Instrucciones:
- Responde de manera amigable y profesional
- Mantén las respuestas concisas pero informativas
- Siempre responde en español
- Tu personalidad es inteligente, útil y un poco juguetona como Ferb

Pregunta del usuario: ${userMessage}`;

    // Generar respuesta con Gemini
    const result = await generateText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      prompt: userMessage,
      temperature: 0.7,
    });

    return Response.json({
      content: result.text,
      contextUsed: 0
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return Response.json(
      { error: `Error interno del servidor: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// Función auxiliar para generar embeddings (reutilizando la lógica existente)
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);

    if (!result.embedding?.values) {
      throw new Error('No embedding returned');
    }

    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Retornar embedding vacío si falla
    return new Array(768).fill(0);
  }
}