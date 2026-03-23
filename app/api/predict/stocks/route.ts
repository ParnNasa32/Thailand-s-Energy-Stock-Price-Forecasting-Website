import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance()

function parseCSV(content: string): Array<Record<string, string>> {
    const lines = content.trim().split('\n')
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map((h) => h.trim())
    return lines.slice(1).map((line) => {
        const values = line.split(',')
        const row: Record<string, string> = {}
        headers.forEach((h, i) => {
            row[h] = (values[i] ?? '').trim()
        })
        return row
    })
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    const csvDir = path.join(process.cwd(), 'scripts', 'รวมplot_df')

    // Return list of all available stock symbols
    if (!symbol) {
        try {
            const files = fs.readdirSync(csvDir)
            const symbols = files
                .filter((f) => f.startsWith('plot_df_') && f.endsWith('.csv'))
                .map((f) => f.replace('plot_df_', '').replace('.csv', ''))
                .sort()
            return NextResponse.json({ symbols })
        } catch {
            return NextResponse.json({ error: 'Cannot read prediction directory' }, { status: 500 })
        }
    }

    // Return prediction data for a specific symbol
    const csvPath = path.join(csvDir, `plot_df_${symbol.toUpperCase()}.csv`)

    if (!fs.existsSync(csvPath)) {
        return NextResponse.json({ error: `No prediction data for ${symbol}` }, { status: 404 })
    }

    try {
        const fileContent = fs.readFileSync(csvPath, 'utf-8')
        const records = parseCSV(fileContent)

        const last20 = records.slice(-22)

        const predictedData = last20
            .map((r) => ({
                date: (r['Date'] ?? '').split('T')[0].split(' ')[0],
                predictedClose: parseFloat(r['Predicted_Close'] ?? '0'),
            }))
            .filter((r) => !isNaN(r.predictedClose) && r.predictedClose > 0)

        // Fetch real prices from Yahoo Finance for the past 3 months (from today)
        let actualData: { date: string; actualClose: number }[] = []
        try {
            const today = new Date()
            const threeMonthsAgo = new Date()
            threeMonthsAgo.setMonth(today.getMonth() - 2)

            // Add 1 day after today as end buffer for Yahoo Finance
            const endDate = new Date(today)
            endDate.setDate(endDate.getDate() + 1)

            const yahooSymbol = symbol.toUpperCase().includes('.')
                ? symbol.toUpperCase()
                : `${symbol.toUpperCase()}.BK`

            const historical = await yahooFinance.chart(yahooSymbol, {
                period1: threeMonthsAgo.toISOString().split('T')[0],
                period2: endDate.toISOString().split('T')[0],
                interval: '1d',
            })

            if (historical?.quotes) {
                actualData = historical.quotes
                    .filter((q) => q.close !== null && q.close !== undefined)
                    .map((q) => ({
                        date: new Date(q.date).toISOString().split('T')[0],
                        actualClose: q.close as number,
                    }))
            }
        } catch (yahooErr) {
            console.warn('Yahoo Finance fetch failed for prediction card:', yahooErr)
            // Non-fatal: we still return predicted data without actual
        }

        // Merge predicted and actual data by date
        const dateSet = new Set([
            ...predictedData.map((d) => d.date),
            ...actualData.map((d) => d.date),
        ])

        const predMap: Record<string, number> = {}
        predictedData.forEach((d) => { predMap[d.date] = d.predictedClose })

        const actualMap: Record<string, number> = {}
        actualData.forEach((d) => { actualMap[d.date] = d.actualClose })

        const mergedData = Array.from(dateSet)
            .sort()
            .map((date) => ({
                date,
                predictedClose: predMap[date] ?? null,
                actualClose: actualMap[date] ?? null,
            }))

        // Extract Run_Date from the last row of the CSV
        const lastRow = records[records.length - 1]
        const runDate = lastRow?.['Run_Date']?.split('T')[0].split(' ')[0] ?? null

        // Compute Mean Squared Error (MSE) over last 10 days where both values exist
        const matchedPairs = mergedData.filter(
            (d) => d.predictedClose !== null && d.actualClose !== null && d.actualClose > 0
        )
        const last10 = matchedPairs.slice(-10)
        let mse: number | null = null
        if (last10.length > 0) {
            const mseVal =
                last10.reduce((sum, d) => {
                    const diff = d.predictedClose! - d.actualClose!
                    return sum + diff * diff
                }, 0) / last10.length
            mse = parseFloat(mseVal.toFixed(4))
        }

        return NextResponse.json({ symbol: symbol.toUpperCase(), data: mergedData, runDate, mse })
    } catch {
        return NextResponse.json({ error: 'Failed to parse CSV' }, { status: 500 })
    }
}
