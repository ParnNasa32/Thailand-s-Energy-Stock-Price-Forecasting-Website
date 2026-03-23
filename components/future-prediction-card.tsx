'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from 'recharts'
import { TrendingUp, Loader2 } from 'lucide-react'

interface ChartPoint {
    date: string
    predictedClose: number | null
    actualClose: number | null
}

interface FuturePredictionCardProps {
    symbol: string
}

export function FuturePredictionCard({ symbol }: FuturePredictionCardProps) {
    const [chartData, setChartData] = useState<ChartPoint[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasPredicted, setHasPredicted] = useState(false)
    const [runDate, setRunDate] = useState<string | null>(null)
    const [mse, setMse] = useState<number | null>(null)

    // Strip .BK suffix to match CSV filenames
    const csvSymbol = symbol.replace(/\.BK$/i, '')

    useEffect(() => {
        if (!csvSymbol) return

        const fetchPrediction = async () => {
            setIsLoading(true)
            setError(null)
            setHasPredicted(false)
            setMse(null)
            try {
                const res = await fetch(`/api/predict/stocks?symbol=${csvSymbol}`)
                const json = await res.json()
                if (json.error) {
                    setError(json.error)
                    setChartData([])
                } else {
                    setChartData(json.data ?? [])
                    setRunDate(json.runDate ?? null)
                    setMse(json.mse ?? null)
                    setHasPredicted(true)
                }
            } catch {
                setError('Failed to fetch prediction data')
                setChartData([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchPrediction()
    }, [csvSymbol])

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr)
            return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })
        } catch {
            return dateStr
        }
    }

    // Compute domain across both series
    const allValues = chartData.flatMap((d) => [
        d.predictedClose ?? null,
        d.actualClose ?? null,
    ]).filter((v): v is number => v !== null && !isNaN(v))

    const minVal = allValues.length > 0 ? Math.min(...allValues) : 0
    const maxVal = allValues.length > 0 ? Math.max(...allValues) : 0
    const padding = (maxVal - minVal) * 0.15 || 1
    const domainMin = parseFloat((minVal - padding).toFixed(2))
    const domainMax = parseFloat((maxVal + padding).toFixed(2))

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <CardTitle className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
                        Future Price Prediction
                    </CardTitle>
                    <CardDescription className="text-md sm:text-lg mt-1 sm:mt-2 text-wrap break-words">
                        การคาดการณ์ราคาหุ้นล่วงหน้า 10 วัน โดยใช้แบบจำลอง LSTM
                        {runDate && (
                            <span className="ml-1 sm:ml-2 text-muted-foreground/70 text-xs sm:text-sm inline-block">
                                (อัปเดตล่าสุด: {runDate})
                            </span>
                        )}
                    </CardDescription>
                </div>

                {/* MSE Badge */}
                {mse !== null && (
                    <div className="flex flex-col items-center">
                        <span className="text-[14px] sm:text-[16px] font-semibold text-muted-foreground leading-none mb-0.5 whitespace-nowrap">
                            MSE (10d)
                        </span>
                        <span
                            className={`text-lg sm:text-xl font-bold leading-none px-1.5 sm:px-2 py-1 rounded-md ${mse <= 10
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : mse <= 50
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}
                        >
                            {mse.toFixed(4)}
                        </span>
                    </div>
                )}
            </CardHeader>

            <CardContent>
                {/* Chart area */}
                <div className="h-[300px] w-full">
                    {!hasPredicted && !isLoading && !error && (
                        <div className="flex h-full items-center justify-center">
                            <p className="text-sm text-muted-foreground">
                                Loading prediction for <span className="font-semibold text-orange-400">{csvSymbol}</span>...
                            </p>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex h-full items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
                                <p className="text-sm text-muted-foreground">Generating prediction...</p>
                            </div>
                        </div>
                    )}

                    {error && !isLoading && (
                        <div className="flex h-full items-center justify-center">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}

                    {hasPredicted && !isLoading && chartData.length > 0 && (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <filter id="glowOrange" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                    <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>

                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    dy={10}
                                    tickFormatter={formatDate}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    dx={-10}
                                    domain={[domainMin, domainMax]}
                                    tickFormatter={(v) => v.toFixed(2)}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1f2937',
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                        color: '#f9fafb',
                                    }}
                                    labelStyle={{ color: '#9ca3af' }}
                                    labelFormatter={(label) => formatDate(label)}
                                    formatter={(value: number, name: string) => [
                                        value != null
                                            ? `฿${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                            : '-',
                                        name === 'predictedClose' ? 'Predicted Close' : 'Actual Close',
                                    ]}
                                />
                                <Legend
                                    formatter={(value) =>
                                        value === 'predictedClose' ? 'Predicted Close' : 'Actual Close'
                                    }
                                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                                />

                                {/* Blue line: Actual price from Yahoo Finance */}
                                <Line
                                    type="monotone"
                                    dataKey="actualClose"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 1 }}
                                    connectNulls={false}
                                    filter="url(#glowBlue)"
                                />

                                {/* Orange dashed line: Predicted price from LSTM model */}
                                <Line
                                    type="monotone"
                                    dataKey="predictedClose"
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 5, fill: '#f97316', stroke: '#fff', strokeWidth: 1 }}
                                    strokeDasharray="5 3"
                                    connectNulls={false}
                                    filter="url(#glowOrange)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Disclaimer */}
                <p className="text-sm sm:text-[15px] text-muted-foreground mt-3 sm:mt-4 leading-relaxed">
                    <strong>หมายเหตุ:</strong> ข้อมูลพยากรณ์เหล่านี้ถูกสร้างขึ้นโดยใช้โมเดล LSTM ที่ผ่านการฝึกฝนจากข้อมูลในอดีต
                    การพยากรณ์นี้จัดทำขึ้นเพื่อวัตถุประสงค์ในการให้ข้อมูลเท่านั้น และไม่ควรนำมาใช้เป็นเกณฑ์หลักเพียงอย่างเดียวในการตัดสินใจลงทุน
                </p>
            </CardContent>
        </Card>
    )
}
