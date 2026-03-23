import { NextResponse } from "next/server"
import { drizzledb } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq, or } from "drizzle-orm"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
    try {
        const { username, email, password, name } = await req.json()

        if (!username || !email || !password) {
            return NextResponse.json(
                { message: "Username, email, and password are required" },
                { status: 400 }
            )
        }

        // Check if user already exists (username or email)
        const [existingUser] = await drizzledb
            .select({ id: users.id })
            .from(users)
            .where(or(eq(users.username, username), eq(users.email, email)))
            .limit(1);

        if (existingUser) {
            return NextResponse.json(
                { message: "Username or email already exists" },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user
        await drizzledb.insert(users).values({
            username,
            email,
            password: hashedPassword,
            name: name || username,
        });

        return NextResponse.json(
            { message: "User created successfully" },
            { status: 201 }
        )
    } catch (error: any) {
        console.error("Registration error:", error)
        return NextResponse.json(
            { message: "An error occurred during registration", error: error.message },
            { status: 500 }
        )
    }
}
