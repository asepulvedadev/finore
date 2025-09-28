import Papa from 'papaparse';

export interface CSVRow {
  [key: string]: string;
}

export async function fetchCSVData(url: string): Promise<CSVRow[]> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }

    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error('Error fetching CSV:', error);
    return [];
  }
}

function parseCSV(csvText: string): CSVRow[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value?.trim() || '',
  });

  if (result.errors.length > 0) {
    console.warn('CSV parsing errors:', result.errors);
  }

  return result.data as CSVRow[];
}