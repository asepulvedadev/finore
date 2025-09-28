import { GoogleGenerativeAI } from '@google/generative-ai';
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

    // Generar respuesta con Gemini usando el SDK directo
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    const result = await model.generateContent(systemPrompt + '\n\n' + userMessage);
    const response = await result.response;
    const text = response.text();

    return Response.json({
      content: text,
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
