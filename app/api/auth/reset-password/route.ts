import { drizzledb } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/schema";
import { eq, and, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ message: "กรุณากรอบรหัสผ่านใหม่" }, { status: 400 });
        }

        // Find valid token
        const [resetToken] = await drizzledb
            .select()
            .from(passwordResetTokens)
            .where(
                and(
                    eq(passwordResetTokens.token, token),
                    gt(passwordResetTokens.expiresAt, new Date())
                )
            )
            .limit(1);

        if (!resetToken) {
            return NextResponse.json({ message: "ลิงก์หมดอายุหรือความไม่ถูกต้อง" }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user password
        await drizzledb
            .update(users)
            .set({ password: hashedPassword })
            .where(eq(users.id, resetToken.userId));

        // Delete used token (and any other expired ones for this user)
        await drizzledb
            .delete(passwordResetTokens)
            .where(eq(passwordResetTokens.userId, resetToken.userId));

        return NextResponse.json({ message: "เปลี่ยนรหัสผ่านสำเร็จแล้ว" });
    } catch (error) {
        console.error("Reset Password Error:", error);
        return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
    }
}
