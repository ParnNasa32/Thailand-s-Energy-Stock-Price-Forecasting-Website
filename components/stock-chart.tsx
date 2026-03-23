'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Customized,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { ChartDataPoint, TimePeriod } from '@/lib/types'

type ChartType = 'line' | 'candlestick'

interface StockChartProps {
  data: ChartDataPoint[]
  period: TimePeriod
  onPeriodChange: (period: TimePeriod) => void
}

// ─── Candlestick SVG Layer ────────────────────────────────────────────────────
// Uses Recharts' Customized component which provides direct access to
// xAxisMap and yAxisMap with their scale functions.
function CandlestickLayer(props: any) {
  const { xAxisMap, yAxisMap, data } = props
  if (!xAxisMap || !yAxisMap || !data) return null

  const xAxis = Object.values(xAxisMap)[0] as any
  const yAxis = Object.values(yAxisMap)[0] as any
  if (!xAxis?.scale || !yAxis?.scale) return null

  const xScale = xAxis.scale
  const yScale = yAxis.scale
  // bandwidth() for band scale (categorical); fallback for linear
  const bandwidth: number = typeof xScale.bandwidth === 'function'
    ? xScale.bandwidth()
    : 10

  return (
    <g>
      {(data as ChartDataPoint[]).map((d, i) => {
        const cx = (xScale(d.date) ?? 0) + bandwidth / 2
        const openY = yScale(d.open)
        const closeY = yScale(d.close)
        const highY = yScale(d.high)
        const lowY = yScale(d.low)

        if ([cx, openY, closeY, highY, lowY].some(isNaN)) return null

        const isGreen = d.close >= d.open
        const color = isGreen ? '#26a69a' : '#ef5350'
        const bodyTop = Math.min(openY, closeY)
        const bodyH = Math.max(Math.abs(closeY - openY), 1.5)
        const halfW = Math.max(bandwidth / 2 - 2, 2)

        return (
          <g key={i}>
            {/* Wick: high → low */}
            <line
              x1={cx} y1={highY}
              x2={cx} y2={lowY}
              stroke={color}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            {/* Body: open ↔ close */}
            <rect
              x={cx - halfW}
              y={bodyTop}
              width={halfW * 2}
              height={bodyH}
              fill={color}
              opacity={0.9}
              rx={1}
            />
          </g>
        )
      })}
    </g>
  )
}

// ─── Custom Tooltip for Candlestick ─────────────────────────────────────────
function CandlestickTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as ChartDataPoint
  if (!d) return null

  const isGreen = d.close >= d.open
  const accent = isGreen ? '#26a69a' : '#ef5350'
  const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2 })

  return (
    <div style={{
      background: '#1a2332',
      border: `1px solid ${accent}66`,
      borderRadius: 8,
      padding: '10px 14px',
      color: '#f9fafb',
      fontSize: 12,
      lineHeight: 1.8,
      boxShadow: '0 4px 20px #0007',
      minWidth: 170,
    }}>
      <p style={{ color: '#9ca3af', marginBottom: 4, fontWeight: 600 }}>
        {d.fullDate || label}
      </p>
      <p>Open&nbsp; : <b style={{ color: accent }}>{fmt(d.open)}</b></p>
      <p style={{ color: '#26a69a' }}>High&nbsp; : <b>{fmt(d.high)}</b></p>
      <p style={{ color: '#ef5350' }}>Low&nbsp;&nbsp; : <b>{fmt(d.low)}</b></p>
      <p>Close : <b style={{ color: accent }}>{fmt(d.close)}</b></p>
    </div>
  )
}

// ─── Main StockChart Component ───────────────────────────────────────────────
export function StockChart({ data, period, onPeriodChange }: StockChartProps) {
  const [chartType, setChartType] = useState<ChartType>('candlestick')

  const periodLabels: Record<TimePeriod, string> = {
    '7d': '7 วัน',
    '30d': '30 วัน',
    '3m': '3 เดือน',
  }

  // Y-axis domain with 6% padding so wicks aren't clipped
  const allLows = data.map((d) => d.low)
  const allHighs = data.map((d) => d.high)
  const minVal = Math.min(...allLows)
  const maxVal = Math.max(...allHighs)
  const pad = (maxVal - minVal) * 0.06

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-start justify-between flex-wrap gap-2">
        <div>
          <CardTitle className="text-lg sm:text-xl font-bold">Stock Price Chart</CardTitle>
          <CardDescription className="text-md sm:text-lg">
            แนวโน้มของราคาหุ้นในช่วง {periodLabels[period].toLowerCase()} ที่ผ่านมา
          </CardDescription>
        </div>

        <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-1">
          {/* ── Chart-type toggle ── */}
          <div className="flex gap-1 border border-border/50 rounded-md p-0.5 sm:mr-5">
            <Button
              variant={chartType === 'candlestick' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('candlestick')}
              className={`h-7 px-3 text-sm sm:text-[16px] ${chartType === 'candlestick' ? 'bg-foreground text-background' : ''}`}
            >
              Candlestick
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('line')}
              className={`h-7 px-3 text-sm sm:text-[16px] ${chartType === 'line' ? 'bg-foreground text-background' : ''}`}
            >
              Line
            </Button>
          </div>

          {/* ── Period buttons ── */}
          <div className="flex items-center gap-1 flex-nowrap">
            {(['3m', '30d', '7d'] as TimePeriod[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPeriodChange(p)}
                className={`text-sm sm:text-[16px] px-2 h-7 whitespace-nowrap ${period === p ? 'bg-foreground text-background' : ''}`}
              >
                {p === '3m' ? '3 เดือน' : p === '30d' ? '30 วัน' : '7 วัน'}
              </Button>
            ))}
          </div>
        </div>

      </CardHeader>

      <CardContent>
        <div className="h-[350px] w-full">
          {chartType === 'line' ? (
            /* ════ LINE / AREA CHART (original) ════ */
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  strokeOpacity={0.4}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  dx={-10}
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => v.toLocaleString()}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f9fafb',
                  }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value: number) => [
                    `฿${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                    'Close',
                  ]}
                  cursor={{
                    stroke: '#9ca3af',
                    strokeWidth: 1,
                    strokeDasharray: '4 4',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke="#9ca3af"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorClose)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            /* ════ CANDLESTICK CHART ════ */
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                barCategoryGap="20%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  strokeOpacity={0.4}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  dx={-10}
                  domain={[minVal - pad, maxVal + pad]}
                  tickFormatter={(v) => v.toLocaleString()}
                />
                <Tooltip
                  content={<CandlestickTooltip />}
                  cursor={{
                    stroke: '#6b7280',
                    strokeWidth: 1,
                    strokeDasharray: '4 4',
                    fill: 'rgba(107,114,128,0.05)',
                  }}
                />

                {/*
                  Invisible Bar — purpose: sets up the band scale on XAxis
                  so each date slot gets a proper bandwidth, and also
                  activates the Tooltip hover zones per bar.
                */}
                <Bar
                  dataKey="close"
                  fill="transparent"
                  stroke="transparent"
                  isAnimationActive={false}
                />

                {/*
                  CandlestickLayer — draws actual OHLC candles using the
                  Recharts Customized component, which receives xAxisMap and
                  yAxisMap with real d3-band + linear scale functions.
                */}
                <Customized component={CandlestickLayer} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
