'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, TrendingUp, Sun, Moon, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { LightRays } from '@/components/ui/light-rays'

export default function LoginPage() {
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const [isLoading, setIsLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [showLoginPassword, setShowLoginPassword] = useState(false)
    const [showRegisterPassword, setShowRegisterPassword] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const username = formData.get('username') as string
        const password = formData.get('password') as string

        try {
            const result = await signIn('credentials', {
                username,
                password,
                redirect: false,
            })

            if (result?.error) {
                toast.error("เข้าสู่ระบบไม่สำเร็จ", { description: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" })
            } else {
                toast.success("ยินดีต้อนรับ", { description: "กำลังเข้าสู่ระบบ..." })
                router.push('/info')
                router.refresh()
            }
        } catch (err) {
            toast.error("เกิดข้อผิดพลาด", { description: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" })
        } finally {
            setIsLoading(false)
        }
    }

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const username = formData.get('username') as string
        const email = formData.get('email') as string
        const password = formData.get('password') as string
        const name = formData.get('name') as string

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, name }),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error("ลงทะเบียนไม่สำเร็จ", { description: data.message })
            } else {
                toast.success("สมัครสมาชิกสำเร็จ", { description: "คุณสามารถเข้าสู่ระบบได้ทันที" })
                const loginTab = document.querySelector('[value="login"]') as HTMLElement
                loginTab?.click()
            }
        } catch (err) {
            toast.error("เกิดข้อผิดพลาด", { description: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" })
        } finally {
            setIsLoading(false)
        }
    }

    if (!mounted) return null

    return (
        <div className="relative min-h-screen bg-background dark:bg-black text-foreground flex flex-col justify-center items-center p-4 sm:p-8 overflow-hidden">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] mix-blend-normal animate-pulse duration-[8000ms]" />
                <div className="absolute top-[40%] right-[10%] w-[30%] h-[50%] rounded-full bg-blue-500/5 blur-[100px] mix-blend-normal animate-pulse duration-[10000ms] delay-1000" />
            </div>

            <LightRays className="z-0" />

            <AnimatedGridPattern
                numSquares={30}
                maxOpacity={0.1}
                duration={3}
                repeatDelay={1}
                className={cn(
                    "absolute inset-0 pointer-events-none z-0",
                    "[mask-image:radial-gradient(800px_circle_at_center,white,transparent)]",
                    "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12"
                )}
            />

            {/* Theme Toggle */}
            <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </div>

            <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 px-4">
                {/* Logo / Header (Left Side) */}
                <div className="flex flex-col items-center lg:items-start space-y-4 text-center lg:text-left lg:w-1/2 w-full mt-15 sm:mt-0 md:mt-1">
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-5 sm:mb-10 md:mb-10">
                        WELCOME
                    </h1>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-snug">
                        Thailand&apos;s Energy Stock Price<br />
                        Forecasting Website
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg">
                        เครื่องมือช่วยวิเคราะห์และคาดการณ์แนวโน้มราคาหุ้นโดยใช้เทคโนโลยี<br className="hidden sm:block" />
                        Machine Learning เพื่อให้นักลงทุนสามารถเข้าใจข้อมูลได้ง่าย<br className="hidden sm:block" />
                        ลดความซับซ้อนในการวิเคราะห์และสนับสนุนการตัดสินใจลงทุนได้อย่างมีประสิทธิภาพ
                    </p>
                </div>

                {/* Auth Card (Right Side) */}
                <div className="relative w-full max-w-[420px] lg:w-1/2 bg-card/60 dark:bg-[#111111]/80 backdrop-blur-xl text-card-foreground border border-border/10 shadow-2xl rounded-[2.5rem] overflow-hidden z-10">
                    <div className="p-8 pb-6 flex flex-col items-center text-center">
                        <h2 className="text-3xl font-semibold tracking-tight mb-2">เข้าสู่ระบบ</h2>
                        <p className="text-sm text-muted-foreground">
                            เข้าสู่ระบบบัญชีของคุณเพื่อดำเนินการต่อ
                        </p>
                    </div>

                    <Tabs defaultValue="login" className="w-full">
                        <div className="px-6 pb-0">
                            <TabsList className="grid w-full grid-cols-2 bg-black/40 p-1 rounded-xl h-12">
                                <TabsTrigger value="login" className="rounded-lg h-10 data-[state=active]:bg-[#222222] data-[state=active]:text-white transition-all">เข้าสู่ระบบ</TabsTrigger>
                                <TabsTrigger value="register" className="rounded-lg h-10 data-[state=active]:bg-[#222222] data-[state=active]:text-white transition-all">สมัครสมาชิก</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="login" className="p-6 pt-6 animate-in fade-in-50 duration-300">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">ชื่อผู้ใช้ หรือ อีเมล</Label>
                                    <Input
                                        id="username"
                                        name="username"
                                        placeholder="ระบุชื่อผู้ใช้ หรือ อีเมล"
                                        autoComplete="username"
                                        required
                                        className="bg-background/50 rounded-lg h-11 border-border/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">รหัสผ่าน</Label>
                                        <Link href="/forgot-password" title="ลืมรหัสผ่าน" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">ลืมรหัสผ่าน?</Link>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showLoginPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            required
                                            className="bg-background/50 rounded-lg h-11 pr-10 border-border/50 [&::-ms-reveal]:hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            <span className="sr-only">{showLoginPassword ? "Hide password" : "Show password"}</span>
                                        </button>
                                    </div>
                                </div>
                                <Button className="w-full rounded-lg mt-4 h-11 bg-foreground text-background hover:bg-foreground/90 font-medium text-base shadow-lg" type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    เข้าสู่ระบบ
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="register" className="p-6 pt-4 animate-in fade-in-50 duration-300">
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                                    <Input id="name" name="name" placeholder="ชื่อ-นามสกุลของคุณ" required className="bg-background/50 rounded-lg h-11 border-border/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-email">อีเมล</Label>
                                    <Input id="reg-email" name="email" type="email" placeholder="example@email.com" required className="bg-background/50 rounded-lg h-11 border-border/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-username">ชื่อผู้ใช้</Label>
                                    <Input id="reg-username" name="username" placeholder="ตั้งชื่อผู้ใช้ของคุณ" required className="bg-background/50 rounded-lg h-11 border-border/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-password">รหัสผ่าน</Label>
                                    <div className="relative">
                                        <Input
                                            id="reg-password"
                                            name="password"
                                            type={showRegisterPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            required
                                            className="bg-background/50 rounded-lg h-11 pr-10 border-border/50 [&::-ms-reveal]:hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            <span className="sr-only">{showRegisterPassword ? "Hide password" : "Show password"}</span>
                                        </button>
                                    </div>
                                </div>
                                <Button className="w-full rounded-lg mt-4 h-11 bg-foreground text-background hover:bg-foreground/90 font-medium text-base shadow-lg" type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    สมัครสมาชิก
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>

                    {/* Social Logins */}
                    <div className="p-6 pt-0 space-y-4">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">หรือ</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                className="w-full bg-background/50 border-border/50 rounded-lg h-11 text-foreground"
                                disabled={isLoading}
                                type="button"
                                onClick={() => {
                                    setIsLoading(true);
                                    signIn('github', { callbackUrl: '/info' });
                                }}
                            >
                                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="github" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="currentColor"></path>
                                </svg>
                                Github
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full bg-background/50 border-border/50 rounded-lg h-11 text-foreground"
                                disabled={isLoading}
                                type="button"
                                onClick={() => {
                                    setIsLoading(true);
                                    signIn('google', { callbackUrl: '/info' });
                                }}
                            >
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                                </svg>
                                Google
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
