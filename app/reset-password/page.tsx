'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Command, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { LightRays } from '@/components/ui/light-rays'
import { cn } from '@/lib/utils'

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    useEffect(() => {
        if (!token) {
            toast.error("ไม่พบรหัส Token", { description: "ลิงก์เข้าสู่หน้านี้ไม่ถูกต้อง" })
            router.push('/login')
        }
    }, [token, router])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirmPassword') as string

        if (password !== confirmPassword) {
            toast.error("รหัสผ่านไม่ตรงกัน", { description: "กรุณาระบุรหัสผ่านให้ตรงกันทั้งสองช่อง" })
            setIsLoading(false)
            return
        }

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error("เกิดข้อผิดพลาด", { description: data.message })
            } else {
                setIsSuccess(true)
                toast.success("เรียบร้อย", { description: "เปลี่ยนรหัสผ่านสำเร็จแล้ว" })
                setTimeout(() => router.push('/login'), 2000)
            }
        } catch (err) {
            toast.error("เกิดข้อผิดพลาด", { description: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" })
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="text-center py-4 space-y-4">
                <p className="text-sm text-green-500 font-medium">
                    เปลี่ยนรหัสผ่านสำเร็จแล้ว! กำลังพากลับไปหน้าเข้าสู่ระบบ...
                </p>
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
            <Label htmlFor="password">รหัสผ่านใหม่</Label>
            <div className="relative">
                <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="bg-background rounded-md h-10 pr-10"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </button>
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
            <div className="relative">
                <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="bg-background rounded-md h-10 pr-10"
                />
                <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                </button>
            </div>
        </div>
            <Button className="w-full rounded-md mt-2" type="submit" disabled={isLoading || !token}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                เปลี่ยนรหัสผ่าน
            </Button>
        </form>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="relative min-h-screen bg-background dark:bg-black text-foreground flex flex-col justify-center items-center p-4 sm:p-8 overflow-hidden">
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

            <div className="relative z-10 w-full max-w-[400px] mx-auto flex flex-col items-center">
                <div className="flex flex-col items-center mb-6 space-y-2 text-center">
                    <div className="h-10 w-10 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center justify-center mb-2 shadow-sm backdrop-blur-sm">
                        <Command className="h-5 w-5" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">ตั้งรหัสผ่านใหม่</h1>
                    <p className="text-sm text-muted-foreground">
                        กรุณาระบุรหัสผ่านใหม่ที่คุณต้องการใช้งาน
                    </p>
                </div>

                <div className="relative w-full bg-card/60 dark:bg-black/60 backdrop-blur-xl text-card-foreground border border-border/50 shadow-2xl rounded-2xl p-6 z-10">
                    <Suspense fallback={<div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>}>
                        <ResetPasswordForm />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
