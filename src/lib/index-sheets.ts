import { supabaseAdmin } from './supabase/admin';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { fetchCSVData } from './csv-parser';
import { generateEmbedding } from './ai';

export async function indexSheetData() {
  console.log('Iniciando indexación de datos...');

  try {
    // 1. OBTENER DATOS DEL CSV
    const csvUrl = process.env.NEXT_PUBLIC_CSV_URL;
    if (!csvUrl) {
      throw new Error('CSV URL not configured');
    }

    const rawData = await fetchCSVData(csvUrl);
    console.log(`Obtenidos ${rawData.length} registros del CSV`);

    // 2. CONFIGURAR TEXT SPLITTER
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunksToInsert = [];

    // 3. PROCESAR CADA FILA
    for (const [index, row] of rawData.entries()) {
      // Convertir fila a texto estructurado
      const rowContent = `
        Fila de la hoja de cálculo #${index + 1}:
        ${Object.entries(row)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n        ')}
      `;

      // Dividir en chunks
      const chunks = await textSplitter.splitText(rowContent);

      for (const chunk of chunks) {
        console.log(`Generando embedding para chunk: ${chunk.substring(0, 50)}...`);

        // Generar embedding
        const embedding = await generateEmbedding(chunk);

        chunksToInsert.push({
          content: chunk,
          metadata: {
            source: 'Google Sheet - Finore Dashboard',
            row_index: index,
            sheet_url: csvUrl,
          },
          embedding: embedding,
        });
      }
    }

    console.log(`Preparando ${chunksToInsert.length} chunks para inserción...`);

    // 4. INSERTAR EN SUPABASE
    const { error } = await supabaseAdmin
      .from('document_chunks')
      .insert(chunksToInsert);

    if (error) {
      console.error('Error al insertar en Supabase:', error);
      return { success: false, error: error.message };
    }

    console.log(`Indexación exitosa. Se insertaron ${chunksToInsert.length} chunks.`);
    return { success: true, count: chunksToInsert.length };

  } catch (error) {
    console.error('Error en indexación:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}