import { NextRequest, NextResponse } from 'next/server'
import { fetchCSVData } from '@/lib/csv-parser'

export async function GET(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_CSV_URL

    if (!url) {
      console.error('CSV URL not configured')
      return NextResponse.json({ error: 'CSV URL not configured' }, { status: 500 })
    }

    console.log('Fetching CSV from:', url)
    const data = await fetchCSVData(url)
    console.log('Fetched data length:', data.length)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching CSV:', error)
    return NextResponse.json({ error: `Failed to fetch CSV data: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 })
  }
}