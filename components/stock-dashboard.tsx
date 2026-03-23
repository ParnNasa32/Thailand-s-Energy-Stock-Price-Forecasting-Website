'use client'

import React from "react"
import { useState, useEffect, useRef } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StockMetricCard } from '@/components/stock-metric-card'
import { StockChart } from '@/components/stock-chart'
import { FuturePredictionCard } from '@/components/future-prediction-card'
import { Sun, Moon, Clock, ChevronsUpDown, Search } from 'lucide-react'
import { useTheme } from "next-themes"
import type { StockData, TimePeriod } from '@/lib/types'
import { UserMenu } from '@/components/user-menu'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function StockDashboard({ symbol: initialSymbol = 'PTT.BK' }: { symbol?: string }) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [symbol, setSymbol] = useState(initialSymbol)
  const [period, setPeriod] = useState<TimePeriod>('30d')

  // Combobox state
  const [symbols, setSymbols] = useState<string[]>([])
  const [isFetchingSymbols, setIsFetchingSymbols] = useState(true)
  const [comboOpen, setComboOpen] = useState(false)
  const [query, setQuery] = useState('')
  const comboRef = useRef<HTMLDivElement>(null)

  // Update internal symbol if prop changes
  useEffect(() => {
    if (initialSymbol !== symbol) {
      setSymbol(initialSymbol)
    }
  }, [initialSymbol])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setComboOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load CSV-based symbol list
  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const res = await fetch('/api/predict/stocks')
        const json = await res.json()
        if (json.symbols) setSymbols(json.symbols)
      } catch {
        // ignore
      } finally {
        setIsFetchingSymbols(false)
      }
    }
    fetchSymbols()
  }, [])

  const { data: history, mutate: mutateHistory, isLoading: isLoadingHistory } = useSWR<any[]>(
    '/api/search-history',
    fetcher
  )

  const { data, error, isLoading } = useSWR<StockData>(
    `/api/stock?symbol=${symbol}&period=${period}`,
    fetcher,
    { refreshInterval: 60000 }
  )

  const filteredSymbols = symbols
    .filter((s) => s.toLowerCase().startsWith(query.toLowerCase()))
    .sort((a, b) => a.localeCompare(b))

  const filteredHistory = Array.isArray(history)
    ? history.filter(item =>
      !query.trim() || item.symbol.toLowerCase().includes(query.toLowerCase())
    )
    : []

  const showHistory = comboOpen && !query.trim() && (isLoadingHistory || filteredHistory.length > 0)

  const handleSelect = async (rawSymbol: string) => {
    setComboOpen(false)
    setQuery('')

    let newSymbol = rawSymbol
    if (!newSymbol.includes('.') && /^[A-Z]+$/.test(newSymbol)) {
      newSymbol = `${newSymbol}.BK`
    }

    router.push(`/stock/${newSymbol}`)

    try {
      await fetch('/api/search-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: newSymbol }),
      })
      mutateHistory()
    } catch (err) {
      console.error('Failed to save history', err)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const getCurrency = () => {
    if (!data?.currency) return '฿'
    if (data.currency === 'THB') return '฿'
    if (data.currency === 'USD') return '$'
    return data.currency
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="relative z-[100] border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 sm:gap-4 px-3 sm:px-4">
          <UserMenu />

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <span className="hidden sm:inline text-sm sm:text-xl text-muted-foreground">Stock:</span>
            <span className="font-semibold text-md sm:text-xl">{symbol.replace('.BK', '')}</span>
          </div>

          {/* Combobox */}
          <div ref={comboRef} className="relative flex-1 max-w-md">
            {/* Trigger */}
            <div
              className={`flex items-center justify-between rounded-md border border-input bg-muted/50 px-3 h-9 text-sm cursor-pointer transition-all ${isFetchingSymbols ? 'opacity-50 pointer-events-none' : 'hover:border-primary/40'
                } ${comboOpen ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}
              onClick={() => {
                setComboOpen((prev) => !prev)
                setQuery('')
              }}
            >
              <div className="flex items-center gap-2 text-muted-foreground min-w-0 pr-1">
                <Search className="h-4 w-4 shrink-0" />
                <span className="truncate text-[15px] sm:text-[17px]">{isFetchingSymbols ? 'Loading...' : 'ค้นหาชื่อหุ้น...'}</span>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>

            {/* Dropdown */}
            {comboOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-[9999] rounded-md border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
                {/* Search input inside dropdown */}
                <div className="p-2 border-b border-border/40">
                  <Input
                    autoFocus
                    placeholder="ค้นหาชื่อหุ้น..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>

                <div className="max-h-[280px] overflow-y-auto">
                  {/* Recent Searches */}
                  {showHistory && (
                    <div>
                      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                          <Clock className="h-3.5 w-3.5" />
                          Recent Searches
                        </div>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={async () => {
                            try {
                              await fetch('/api/search-history', { method: 'DELETE' })
                              mutateHistory([], false)
                              setComboOpen(false)
                              toast.success('ประวัติการค้นหาถูกลบแล้ว')
                            } catch {
                              toast.error('ไม่สามารถลบประวัติการค้นหาได้')
                            }
                          }}
                          className="text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="p-1">
                        {isLoadingHistory ? (
                          <div className="space-y-1 p-2">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                          </div>
                        ) : (
                          filteredHistory.map((item, idx) => (
                            <button
                              type="button"
                              key={idx}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleSelect(item.symbol)}
                              className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm hover:bg-muted/50 transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <Search className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
                                <span className="font-medium text-foreground/90">{item.symbol.replace('.BK', '')}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground/60">
                                {new Date(item.createdAt || item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                      {filteredSymbols.length > 0 && <div className="border-t border-border/30 mx-2" />}
                    </div>
                  )}

                  {/* Symbols list */}
                  {filteredSymbols.length > 0 && (
                    <ul className="py-1">
                      {filteredSymbols.map((s) => (
                        <li
                          key={s}
                          className={`flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm mx-1 ${s === symbol.replace('.BK', '') ? 'bg-accent/60' : ''
                            }`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelect(s)}
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}

                  {!isFetchingSymbols && filteredSymbols.length === 0 && !showHistory && (
                    <div className="px-3 py-3 text-sm text-muted-foreground text-center">No results</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="ml-auto">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        {isLoading && (
          <div className="flex h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" />
              <p className="text-sm text-muted-foreground">Loading stock data...</p>
            </div>
          </div>
        )}

        {(error || (data && data.error)) && (
          <div className="flex h-[60vh] items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-destructive">Error loading data</p>
              <p className="text-sm text-muted-foreground">
                {data?.error || 'Please try again or search for a different stock'}
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Try: PTT, EA, BANPU, IRPC, NOVA
              </p>
            </div>
          </div>
        )}

        {data && !isLoading && !data.error && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <StockMetricCard
                label={data.metrics.open.label}
                value={data.metrics.open.value}
                change={data.metrics.open.change}
                description={data.metrics.open.description}
                subtext={data.metrics.open.subtext}
                currency={getCurrency()}
              />
              <StockMetricCard
                label={data.metrics.high.label}
                value={data.metrics.high.value}
                change={data.metrics.high.change}
                description={data.metrics.high.description}
                subtext={data.metrics.high.subtext}
                currency={getCurrency()}
              />
              <StockMetricCard
                label={data.metrics.volume.label}
                value={data.metrics.volume.value}
                change={data.metrics.volume.change}
                description={data.metrics.volume.description}
                subtext={data.metrics.volume.subtext}
                isVolume
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <StockMetricCard
                label={data.metrics.close.label}
                value={data.metrics.close.value}
                change={data.metrics.close.change}
                description={data.metrics.close.description}
                subtext={data.metrics.close.subtext}
                currency={getCurrency()}
              />
              <StockMetricCard
                label={data.metrics.low.label}
                value={data.metrics.low.value}
                change={data.metrics.low.change}
                description={data.metrics.low.description}
                subtext={data.metrics.low.subtext}
                currency={getCurrency()}
              />
              <StockMetricCard
                label={data.metrics.adjClose.label}
                value={data.metrics.adjClose.value}
                change={data.metrics.adjClose.change}
                description={data.metrics.adjClose.description}
                subtext={data.metrics.adjClose.subtext}
                currency={getCurrency()}
              />
            </div>

            <StockChart
              data={data.chartData}
              period={period}
              onPeriodChange={setPeriod}
            />

            <FuturePredictionCard symbol={symbol} />
          </div>
        )}
      </main>
    </div>
  )
}
