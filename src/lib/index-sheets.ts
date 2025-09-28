import { supabaseAdmin } from './supabase/admin';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { fetchCSVData } from './csv-parser';
import { generateEmbedding } from './ai';
import crypto from 'crypto';

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

    // 2. CALCULAR HASH DE LOS DATOS PARA VERIFICAR CAMBIOS
    const dataString = JSON.stringify(rawData);
    const dataHash = crypto.createHash('md5').update(dataString).digest('hex');

    // 3. VERIFICAR SI LOS DATOS HAN CAMBIADO
    const { data: existingMetadata } = await supabaseAdmin
      .from('document_chunks')
      .select('metadata')
      .eq('metadata->>source', 'Google Sheet - Finore Dashboard')
      .limit(1);

    const existingHash = existingMetadata?.[0]?.metadata?.data_hash;

    if (existingHash === dataHash) {
      console.log('Los datos no han cambiado. No se requiere reindexación.');
      return { success: true, count: 0, message: 'Datos ya actualizados' };
    }

    // 4. SI HAY CAMBIOS, LIMPIAR DATOS ANTERIORES
    console.log('Detectados cambios en los datos. Reindexando...');
    const { error: deleteError } = await supabaseAdmin
      .from('document_chunks')
      .delete()
      .eq('metadata->>source', 'Google Sheet - Finore Dashboard');

    if (deleteError) {
      console.error('Error al limpiar datos anteriores:', deleteError);
    }

    // 5. CONFIGURAR TEXT SPLITTER
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunksToInsert = [];

    // 6. PROCESAR CADA FILA
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
            data_hash: dataHash,
            indexed_at: new Date().toISOString(),
          },
          embedding: embedding,
        });
      }
    }

    console.log(`Preparando ${chunksToInsert.length} chunks para inserción...`);

    // 7. INSERTAR EN SUPABASE
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

export async function checkAndIndexData() {
  console.log('Verificando y indexando datos si es necesario...');

  try {
    const result = await indexSheetData();
    return result;
  } catch (error) {
    console.error('Error en verificación de indexación:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}