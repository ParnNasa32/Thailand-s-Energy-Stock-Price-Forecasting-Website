'use client'

import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StockMetricCardProps {
  label: string
  value: number
  change: number
  description: string
  subtext: string
  currency?: string
  isVolume?: boolean
}

export function StockMetricCard({
  label,
  value,
  change,
  description,
  subtext,
  currency = '฿',
  isVolume = false,
}: StockMetricCardProps) {
  const isPositive = change >= 0
  const formattedValue = isVolume
    ? value.toLocaleString('en-US', { maximumFractionDigits: 1 })
    : `${currency}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <p className="text-xl sm:text-xl font-medium text-muted-foreground">{label}</p>
          <div
            className={`flex items-center gap-1.5 text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'
              }`}
          >
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
            <span>{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
          </div>
        </div>

        <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">{formattedValue}</p>

        <div className="mt-3 sm:mt-4 flex items-center gap-1.5">
          <p className="text-md sm:text-[17px] font-medium text-amber-400">{description}</p>
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
          )}
        </div>

        <p className="mt-1 sm:mt-1 text-md sm:text-[17px] text-muted-foreground break-words text-wrap">{subtext}</p>
      </CardContent>
    </Card>
  )
}
