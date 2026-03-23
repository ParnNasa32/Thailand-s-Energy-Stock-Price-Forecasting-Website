import { drizzledb } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.error("Missing RESEND_API_KEY environment variable");
            return NextResponse.json({ message: "ระบบส่งอีเมลยังไม่ได้ตั้งค่า (Missing API Key)" }, { status: 500 });
        }
        
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ message: "กรุณาระบุอีเมล" }, { status: 400 });
        }

        // Check if user exists
        const [user] = await drizzledb
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!user) {
            // We return 200 even if user not found for security reasons (don't reveal registered emails)
            return NextResponse.json({ message: "หากอีเมลนี้อยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้" });
        }

        // Generate token
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

        // Save token to DB
        await drizzledb.insert(passwordResetTokens).values({
            userId: user.id,
            token,
            expiresAt,
        });

        // Send email
        const baseUrl = process.env.NEXTAUTH_URL || `http://${req.headers.get("host")}`;
        const resetLink = `${baseUrl}/reset-password?token=${token}`;

        const { data, error } = await resend.emails.send({
            from: "Stock Index <onboarding@resend.dev>",
            to: [email],
            subject: "รีเซ็ตรหัสผ่าน - Stock Index",
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #0f172a; margin-bottom: 20px;">รีเซ็ตรหัสผ่านของคุณ</h2>
                    <p style="color: #475569; line-height: 1.5;">คุณได้รับอีเมลนี้เนื่องจากมีการร้องขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณใน Stock Index</p>
                    <div style="margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">รีเซ็ตรหัสผ่าน</a>
                    </div>
                    <p style="color: #64748b; font-size: 14px;">ลิงก์นี้จะหมดอายุภายใน 1 ชั่วโมง</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p style="color: #94a3b8; font-size: 12px;">หากคุณไม่ได้ร้องขออีเมลนี้ โปรดเพิกเฉย</p>
                </div>
            `,
        });

        if (error) {
            console.error("Resend Error:", error);
            return NextResponse.json({ message: "ไม่สามารถส่งอีเมลได้ในขณะนี้" }, { status: 500 });
        }

        return NextResponse.json({ message: "ส่งลิงก์รีเซ็ตรหัสผ่านไปให้ทางอีเมลแล้ว" });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
    }
}
