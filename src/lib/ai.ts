import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const model = genAI.getGenerativeModel({ model: 'embedding-001' });

    const result = await model.embedContent(text);

    const embedding = result.embedding;

    if (!embedding || !embedding.values) {
      throw new Error('No embedding returned from Gemini API');
    }

    return embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
    throw new Error('Failed to generate embedding: Unknown error');
  }
}