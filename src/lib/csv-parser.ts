export interface CSVRow {
  [key: string]: string;
}

export async function fetchCSVData(url: string): Promise<CSVRow[]> {
  try {
    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

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
  const lines = csvText.trim().split('\n');

  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));

  return lines.slice(1).map(line => {
    const values = line.split(',').map(value => value.trim().replace(/"/g, ''));
    const row: CSVRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    return row;
  });
}