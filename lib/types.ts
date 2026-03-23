export interface StockMetric {
  value: number
  change: number
  label: string
  description: string
  subtext: string
}

export interface ChartDataPoint {
  date: string
  fullDate: string
  close: number
  open: number
  high: number
  low: number
  volume: number
}

export interface StockData {
  symbol: string
  currency: string
  metrics: {
    open: StockMetric
    high: StockMetric
    low: StockMetric
    close: StockMetric
    adjClose: StockMetric
    volume: StockMetric
  }
  chartData: ChartDataPoint[]
  error?: string
}

export type TimePeriod = '7d' | '30d' | '3m'
