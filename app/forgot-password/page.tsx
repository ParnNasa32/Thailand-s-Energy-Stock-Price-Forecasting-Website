'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Command, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { LightRays } from '@/components/ui/light-rays'
import { cn } from '@/lib/utils'

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error("เกิดข้อผิดพลาด", { description: data.message })
            } else {
                setIsSent(true)
                toast.success("ส่งเรียบร้อยแล้ว", { description: data.message })
            }
        } catch (err) {
            toast.error("เกิดข้อผิดพลาด", { description: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" })
        } finally {
            setIsLoading(false)
        }
    }

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
                    <h1 className="text-2xl font-semibold tracking-tight">ลืมรหัสผ่าน?</h1>
                    <p className="text-sm text-muted-foreground">
                        ระบุอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
                    </p>
                </div>

                <div className="relative w-full bg-card/60 dark:bg-black/60 backdrop-blur-xl text-card-foreground border border-border/50 shadow-2xl rounded-2xl p-6 z-10">
                    {!isSent ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">อีเมล</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="example@email.com"
                                    required
                                    className="bg-background rounded-md h-10"
                                />
                            </div>
                            <Button className="w-full rounded-md mt-2" type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                ส่งลิงก์รีเซ็ตรหัสผ่าน
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center py-4 space-y-4">
                            <p className="text-sm text-muted-foreground">
                                เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว โปรดตรวจสอบกล่องจดหมายของคุณ (รวมถึงในจดหมายขยะ)
                            </p>
                            <Button variant="outline" className="w-full rounded-md" asChild>
                                <Link href="/login">กลับไปหน้าล็อกอิน</Link>
                            </Button>
                        </div>
                    )}
                </div>

                <Link href="/login" className="mt-8 text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    กลับไปหน้าล็อกอิน
                </Link>
            </div>
        </div>
    )
}
