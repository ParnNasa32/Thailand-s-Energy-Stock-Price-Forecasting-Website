'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, BarChart2, Moon, Sun, ChevronsUpDown, Check, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTheme } from 'next-themes'
import { UserMenu } from '@/components/user-menu'
import { cn } from '@/lib/utils'
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export default function InfoPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Combobox state
  const [symbols, setSymbols] = useState<string[]>([])
  const [isFetchingSymbols, setIsFetchingSymbols] = useState(true)
  const [comboOpen, setComboOpen] = useState(false)
  const [query, setQuery] = useState('')
  const comboRef = useRef<HTMLDivElement>(null)

  // Recent searches from DB
  const [history, setHistory] = useState<{ symbol: string; createdAt?: string }[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  // Info section slide state (0 = graph panel, 1 = definitions panel)
  const [infoSlide, setInfoSlide] = useState(0)
  const INFO_SLIDES = 3
  const infoRef = useRef<HTMLDivElement>(null)
  const isInfoScrollingRef = useRef(false)

  const filteredSymbols = symbols
    .filter((s) => s.toLowerCase().startsWith(query.toLowerCase()))
    .sort((a, b) => a.localeCompare(b))

  const filteredHistory = history.filter(
    (item) => !query.trim() || item.symbol.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    setMounted(true)
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

  // Load recent search history from DB
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/search-history')
        if (res.ok) {
          const data = await res.json()
          setHistory(Array.isArray(data) ? data : [])
        }
      } catch {
        // ignore
      } finally {
        setIsLoadingHistory(false)
      }
    }
    fetchHistory()
  }, [])

  // Close dropdown on outside click
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

  // Wheel + touch-swipe handler on info section only
  useEffect(() => {
    const el = infoRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (isInfoScrollingRef.current) return

      if (e.deltaY > 0 && infoSlide < INFO_SLIDES - 1) {
        isInfoScrollingRef.current = true
        setInfoSlide((prev) => prev + 1)
        setTimeout(() => { isInfoScrollingRef.current = false }, 600)
      } else if (e.deltaY < 0 && infoSlide > 0) {
        isInfoScrollingRef.current = true
        setInfoSlide((prev) => prev - 1)
        setTimeout(() => { isInfoScrollingRef.current = false }, 600)
      }
    }

    // Touch swipe support
    let touchStartX = 0
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX
    }
    const handleTouchEnd = (e: TouchEvent) => {
      if (isInfoScrollingRef.current) return
      const deltaX = touchStartX - e.changedTouches[0].clientX
      if (Math.abs(deltaX) < 50) return // too short, ignore

      if (deltaX > 0 && infoSlide < INFO_SLIDES - 1) {
        // swipe left → next slide
        isInfoScrollingRef.current = true
        setInfoSlide((prev) => prev + 1)
        setTimeout(() => { isInfoScrollingRef.current = false }, 600)
      } else if (deltaX < 0 && infoSlide > 0) {
        // swipe right → prev slide
        isInfoScrollingRef.current = true
        setInfoSlide((prev) => prev - 1)
        setTimeout(() => { isInfoScrollingRef.current = false }, 600)
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('wheel', handleWheel)
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [infoSlide])

  const handleSelect = async (symbol: string) => {
    setComboOpen(false)
    setQuery('')

    let fullSymbol = symbol
    if (!fullSymbol.includes('.') && /^[A-Z]+$/.test(fullSymbol)) {
      fullSymbol = `${fullSymbol}.BK`
    }

    try {
      await fetch('/api/search-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: fullSymbol }),
      })
    } catch (err) {
      console.error('Failed to save history', err)
    }

    router.push(`/stock/${fullSymbol}`)
  }

  const handleClearHistory = async () => {
    try {
      await fetch('/api/search-history', { method: 'DELETE' })
      setHistory([])
      toast.success('ประวัติการค้นหาถูกลบแล้ว')
    } catch {
      toast.error('ไม่สามารถลบประวัติการค้นหาได้')
    }
  }

  const showHistory = comboOpen && !query.trim() && (isLoadingHistory || filteredHistory.length > 0)
  const showSymbols = comboOpen && filteredSymbols.length > 0
  const showNoResults = comboOpen && !isFetchingSymbols && filteredSymbols.length === 0 && !showHistory

  if (!mounted) return null

  const priceItems = [
    {
      title: 'ราคาปิด (Closing Price)',
      desc: 'คือราคาซื้อขายสุดท้ายก่อนตลาดปิดในวันนั้น มักถูกใช้เป็นค่าหลักในการวิเคราะห์แนวโน้มของหุ้น',
    },
    {
      title: 'ราคาเปิด (Opening Price)',
      desc: 'คือราคาของหุ้นในการซื้อขายครั้งแรกของวัน ซึ่งสะท้อนมุมมองของนักลงทุนต่อข้อมูลหรือข่าวสารที่เกิดขึ้นก่อนตลาดเปิด',
    },
    {
      title: 'ราคาที่สูงที่สุดของการซื้อขายของหุ้น (High Price)',
      desc: 'คือราคาสูงที่สุดที่มีการซื้อขายหุ้นในช่วงเวลานั้น โดยแสดงถึงระดับราคาสูงสุดที่นักลงทุนยอมซื้อ',
    },
    {
      title: 'ราคาที่ต่ำที่สุดของการซื้อขายของหุ้น (Low Price)',
      desc: 'คือราคาต่ำที่สุดที่มีการซื้อขายในช่วงเวลานั้น แสดงถึงระดับราคาต่ำสุดที่นักลงทุนยอมขาย',
    },
    {
      title: 'ราคาที่ปรับปรุงแล้ว (Adjusted Close)',
      desc: 'คือราคาปิดที่มีการปรับค่าเพื่อสะท้อนเหตุการณ์สำคัญ เช่น การจ่ายเงินปันผล การแตกพาร์ หรือการเพิ่มทุน เพื่อให้ข้อมูลมีความต่อเนื่องและสามารถนำไปวิเคราะห์ย้อนหลังได้อย่างถูกต้อง',
    },
    {
      title: 'ปริมาณการซื้อขาย (Volume)',
      desc: 'คือจำนวนหุ้นทั้งหมดที่ถูกซื้อขายในช่วงเวลานั้น ใช้บ่งบอกความสนใจและสภาพคล่องของหุ้น ยิ่งมีปริมาณการซื้อขายสูง แสดงว่าหุ้นนั้นมีความเคลื่อนไหวและได้รับความสนใจจากนักลงทุนมาก',
    },
  ]

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] animate-pulse" style={{ animationDuration: '8000ms' }} />
        <div className="absolute top-[50%] right-[5%] w-[35%] h-[50%] rounded-full bg-blue-500/5 blur-[100px] animate-pulse" style={{ animationDuration: '10000ms', animationDelay: '1000ms' }} />
        <div className="absolute bottom-[10%] left-[20%] w-[30%] h-[40%] rounded-full bg-primary/3 blur-[100px] animate-pulse" style={{ animationDuration: '12000ms', animationDelay: '2000ms' }} />
      </div>

      <AnimatedGridPattern
        numSquares={25}
        maxOpacity={0.06}
        duration={4}
        repeatDelay={1}
        className={cn(
          "absolute inset-0 pointer-events-none z-0",
          "[mask-image:radial-gradient(900px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-20%] h-[140%]"
        )}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-border/30 bg-card/20 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <UserMenu />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center px-4 py-8 sm:py-10">

        {/* Hero Section */}
        <div className="text-center max-w-3xl mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6 backdrop-blur-sm">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-5 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            Thailand's Energy Stock Price Forecasting Website
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            เครื่องมือช่วยวิเคราะห์และคาดการณ์แนวโน้มราคาหุ้น ด้วยเทคโนโลยี <strong>Machine Learning</strong>
            <br />
            ที่ออกแบบมาเพื่อให้นักลงทุนเข้าใจข้อมูลได้ง่ายขึ้น ลดความซับซ้อนในการวิเคราะห์
            <br />
            และช่วยสนับสนุนการตัดสินใจลงทุนอย่างมีประสิทธิภาพ
          </p>
        </div>

        {/* Combobox Search */}
        <div className="w-full max-w-2xl mb-16">
          <div ref={comboRef} className="relative">
            {/* Trigger */}
            <div
              className={cn(
                'flex items-center justify-between rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl px-5 h-14 text-base cursor-pointer shadow-lg transition-all',
                isFetchingSymbols ? 'opacity-60 pointer-events-none' : 'hover:border-primary/40',
                comboOpen && 'border-primary/50 ring-2 ring-primary/20'
              )}
              onClick={() => {
                setComboOpen((prev) => !prev)
                setQuery('')
              }}
            >
              <div className="flex items-center gap-3 text-muted-foreground">
                <Search className="h-5 w-5 text-muted-foreground/60" />
                <span className={isFetchingSymbols ? 'text-muted-foreground' : ''}>
                  {isFetchingSymbols ? 'Loading...' : 'ค้นหาชื่อหุ้น เช่น PTT, EA, BANPU...'}
                </span>
              </div>
              <ChevronsUpDown className="h-5 w-5 text-muted-foreground/60 shrink-0" />
            </div>

            {/* Dropdown */}
            {comboOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden">
                {/* Search input inside dropdown */}
                <div className="p-2 border-b border-border/40">
                  <Input
                    autoFocus
                    placeholder="พิมพ์เพื่อค้นหา..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-9 text-sm bg-muted/40"
                  />
                </div>

                <div className="max-h-[320px] overflow-y-auto">
                  {/* Recent Searches section */}
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
                          onClick={handleClearHistory}
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
                              key={idx}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleSelect(item.symbol)}
                              className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm hover:bg-muted/50 transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <Search className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
                                <span className="font-medium text-foreground/90">{item.symbol.replace('.BK', '')}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground/60">
                                {item.createdAt
                                  ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                  : ''}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                      {showSymbols && <div className="border-t border-border/30 mx-2" />}
                    </div>
                  )}

                  {/* Symbols list */}
                  {showSymbols && (
                    <ul className="py-1">
                      {filteredSymbols.map((s) => (
                        <li
                          key={s}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm mx-1"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelect(s)}
                        >
                          <Check className="h-3.5 w-3.5 shrink-0 opacity-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}

                  {showNoResults && (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">ไม่พบหุ้น</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Info Section with slide switcher ── */}
        <div className="w-full max-w-4xl">
          {/* Slide indicator + nav */}
          <div className="flex items-center justify-center gap-3 mb-4">
            {/* Prev button */}
            <button
              onClick={() => setInfoSlide((p) => Math.max(0, p - 1))}
              disabled={infoSlide === 0}
              className="p-1.5 rounded-lg hover:bg-muted/40 disabled:opacity-30 transition-all"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>

            {/* Dot indicators */}
            <div className="flex gap-1.5">
              {Array.from({ length: INFO_SLIDES }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setInfoSlide(i)}
                  className={cn(
                    'h-3 rounded-full transition-all duration-300',
                    infoSlide === i ? 'w-8 bg-primary' : 'w-3 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                  )}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Next button */}
            <button
              onClick={() => setInfoSlide((p) => Math.min(INFO_SLIDES - 1, p + 1))}
              disabled={infoSlide === INFO_SLIDES - 1}
              className="p-1.5 rounded-lg hover:bg-muted/40 disabled:opacity-30 transition-all"
              aria-label="Next slide"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          </div>

          {/* Slides viewport */}
          <div
            ref={infoRef}
            className="relative overflow-hidden rounded-2xl border border-border/30 bg-card/20 backdrop-blur-sm"
          >
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${infoSlide * 100}%)` }}
            >
              {/* Slide 0: Graph types */}
              <div className="w-full flex-shrink-0 p-6 md:p-8">
                <h2 className="text-lg sm:text-2xl font-bold mb-5 text-foreground">การอ่านกราฟหุ้น</h2>
                <div className="flex flex-col gap-6">

                  {/* Row 1: Line Chart */}
                  <div className="flex flex-col md:flex-row gap-5 items-start">
                    <div className="flex-shrink-0 w-full md:w-48">
                      <div className="relative rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden aspect-[4/3] shadow-xl">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg viewBox="0 0 200 120" className="w-full h-full p-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <line x1="20" y1="20" x2="20" y2="100" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                            <line x1="20" y1="100" x2="190" y2="100" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                            <line x1="20" y1="60" x2="190" y2="60" stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1="20" y1="40" x2="190" y2="40" stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1="20" y1="80" x2="190" y2="80" stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="4 4" />
                            <polyline points="20,80 45,65 70,70 95,50 120,55 145,45 170,35 190,30" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            <polyline points="120,55 145,42 170,32 190,25" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray="5 3" />
                            <circle cx="20" cy="80" r="2.5" fill="#3b82f6" />
                            <circle cx="190" cy="30" r="2.5" fill="#3b82f6" />
                            <circle cx="190" cy="25" r="2.5" fill="#f97316" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <p className="font-semibold text-md sm:text-[19px] text-foreground">กราฟเส้น (Line Chart)</p>
                      <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                        เป็นกราฟที่แสดงจุดราคาปิดในแต่ละวัน แล้วลากต่อเนื่องกัน
                        สามารถใช้ดูแนวโน้มของราคาว่ากำลังอยู่ในช่วงขาขึ้นหรือช่วงขาลง เป็นกราฟที่อ่านค่าง่าย
                        เหมาะสำหรับการสอนดูกราฟหุ้นสำหรับมือใหม่ที่เพิ่งเริ่มลงทุน
                      </p>
                      <p className="text-sm sm:text-[15px] text-muted-foreground">• เส้น<span className="text-blue-400">สีฟ้า</span> เป็นเส้นราคาปิดจริง</p>
                      <p className="text-sm sm:text-[15px] text-muted-foreground">• เส้น<span className="text-orange-400">สีส้ม</span> เป็นเส้นที่พยากรณ์</p>
                      <p className="text-sm sm:text-[15px] text-muted-foreground/60 text-red-500 italic pt-1">**ค่า MSE คือ ค่าความคลาดเคลื่อน ยิ่ง MSE มีค่าน้อย แบบจำลองยิ่งมีความแม่นยำสูง</p>
                    </div>
                  </div>

                  <div className="border-t border-border/20" />

                  {/* Row 2: Candlestick Chart */}
                  <div className="flex flex-col md:flex-row gap-5 items-start">
                    <div className="flex-shrink-0 w-full md:w-48">
                      <div className="relative rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden aspect-[4/3] shadow-xl">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg viewBox="0 0 200 120" className="w-full h-full p-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <line x1="20" y1="20" x2="20" y2="100" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                            <line x1="20" y1="100" x2="190" y2="100" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                            <line x1="40" y1="35" x2="40" y2="80" stroke="#22c55e" strokeWidth="1" />
                            <rect x="34" y="45" width="12" height="25" fill="#22c55e" rx="1" />
                            <line x1="70" y1="30" x2="70" y2="75" stroke="#22c55e" strokeWidth="1" />
                            <rect x="64" y="40" width="12" height="22" fill="#22c55e" rx="1" />
                            <line x1="100" y1="38" x2="100" y2="80" stroke="#ef4444" strokeWidth="1" />
                            <rect x="94" y="48" width="12" height="22" fill="#ef4444" rx="1" />
                            <line x1="130" y1="25" x2="130" y2="68" stroke="#22c55e" strokeWidth="1" />
                            <rect x="124" y="33" width="12" height="22" fill="#22c55e" rx="1" />
                            <line x1="160" y1="22" x2="160" y2="60" stroke="#22c55e" strokeWidth="1" />
                            <rect x="154" y="30" width="12" height="20" fill="#22c55e" rx="1" />
                            <line x1="185" y1="28" x2="185" y2="65" stroke="#ef4444" strokeWidth="1" />
                            <rect x="179" y="36" width="12" height="20" fill="#ef4444" rx="1" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <p className="font-semibold text-md sm:text-[19px] text-foreground">กราฟแท่งเทียน (Candlesticks)</p>
                      <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                        เป็นกราฟที่ได้รับความนิยมมากที่สุดในปัจจุบัน สามารถแสดงความเคลื่อนไหว อ่านค่าง่าย
                        โดยกราฟแท่งเทียนจะมีส่วนประกอบหลัก 3 อย่าง คือ ตัวเนื้อเทียน ตัวไส้เทียนด้านบน
                        และตัวไส้เทียนด้านล่าง โดยแบ่งการอธิบายออกเป็น 2 สี คือ
                      </p>
                      <p className="text-sm sm:text-[15px] text-muted-foreground">• แท่งเทียน<span className="text-green-400">สีเขียว</span> แสดงถึงราคากราฟที่เพิ่มขึ้น</p>
                      <p className="text-sm sm:text-[15px] text-muted-foreground">• แท่งเทียน<span className="text-red-400">สีแดง</span> แสดงถึงราคากราฟที่ต่ำลง</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Slide 1: Price data definitions */}
              <div className="w-full flex-shrink-0 p-6 md:p-8">
                <h2 className="text-lg sm:text-2xl font-bold mb-5 text-foreground">ความหมายของข้อมูลราคาหุ้นรายวัน</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {priceItems.map((item) => (
                    <div key={item.title} className="rounded-xl border border-border/30 bg-muted/20 p-4">
                      <p className="font-semibold text-md sm:text-[16px] text-foreground mb-1">{item.title}</p>
                      <p className="text-sm sm:text-md text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slide 2: วิธีการเลือกหุ้น */}
              <div className="w-full flex-shrink-0 p-6 md:p-8">
                <h2 className="text-lg sm:text-2xl font-bold mb-5 text-foreground">วิธีการเลือกหุ้น</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="rounded-xl border border-border/30 bg-muted/20 p-4 space-y-1.5">
                    <p className="font-semibold text-md sm:text-[16px] text-foreground">1. ดูแนวโน้มราคา</p>
                    <p className="text-sm sm:text-md text-muted-foreground">• ถ้าราคาหุ้นอยู่ในแนวโน้มขาขึ้น → มีโอกาสน่าซื้อ</p>
                    <p className="text-sm sm:text-md text-muted-foreground">• ถ้าเป็น ขาลง → ควรรรอหรือหลีกเลี่ยง</p>
                  </div>

                  <div className="rounded-xl border border-border/30 bg-muted/20 p-4 space-y-1.5">
                    <p className="font-semibold text-md sm:text-[16px] text-foreground">2. วิเคราะห์จากข้อมูล OHLCV</p>
                    <p className="text-sm sm:text-md text-muted-foreground">• ราคาปิด ใช้ดูแนวโน้มหลัก</p>
                    <p className="text-sm sm:text-md text-muted-foreground">• ราคาสูงสุด/ราคาต่ำสุด ใช้ดูความผันผวน</p>
                    <p className="text-sm sm:text-md text-muted-foreground">• Volume <strong className="text-foreground">สำคัญมาก</strong></p>
                    <p className="text-sm sm:text-md text-muted-foreground pl-3">ถ้าราคาขึ้น + Volume สูง → สัญญาณดี</p>
                    <p className="text-sm sm:text-md text-muted-foreground pl-3">ถ้าราคาขึ้น + Volume ต่ำ → อาจไม่แข็งแรง</p>
                  </div>

                  <div className="rounded-xl border border-border/30 bg-muted/20 p-4 space-y-1.5">
                    <p className="font-semibold text-md sm:text-[16px] text-foreground">3. ดูพื้นฐานบริษัท</p>
                    <p className="text-sm sm:text-md text-muted-foreground">• บริษัทมีกำไรต่อเนื่องไหม</p>
                    <p className="text-sm sm:text-md text-muted-foreground">• อยู่ในอุตสาหกรรมที่เติบโตหรือไม่</p>
                    <p className="text-sm sm:text-md text-muted-foreground">• มีข่าวดี / โครงการใหม่ / นโยบายรัฐสนับสนุนไหม</p>
                  </div>

                  <div className="rounded-xl border border-border/30 bg-muted/20 p-4 space-y-1.5">
                    <p className="font-semibold text-md sm:text-[16px] text-foreground">4. หาจังหวะเข้าซื้อ</p>
                    <p className="text-sm sm:text-md text-muted-foreground">• ไม่ควรซื้อ &quot;ตอนราคาพุ่งแรงมาก&quot;</p>
                    <p className="text-sm sm:text-md text-muted-foreground">• ควรรอจังหวะ ย่อตัว แล้วค่อยเข้า</p>
                    <p className="text-sm sm:text-md text-muted-foreground">• ซื้อใกล้ แนวรับ จะเสี่ยงน้อยกว่า</p>
                  </div>

                  <div className="md:col-span-2 rounded-xl border border-border/30 bg-muted/20 p-4 space-y-1.5">
                    <p className="font-semibold text-md sm:text-[16px] text-foreground">5. บริหารความเสี่ยง</p>
                    <p className="text-sm sm:text-md text-muted-foreground">• ตั้งจุดตัดขาดทุน เช่น -5% หรือ -10%</p>
                    <p className="text-sm sm:text-md text-muted-foreground">• ไม่ควรลงทุนทั้งหมดในหุ้นตัวเดียว</p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
