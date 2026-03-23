import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { drizzledb } from "@/lib/db"
import { users, searchHistory } from "@/lib/schema"
import { eq, or, desc, notInArray } from "drizzle-orm"

export async function GET() {
    const session = await getServerSession()

    if (!session?.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const username = (session.user as any).username || session.user.name;
        const [user] = await drizzledb
            .select({ id: users.id })
            .from(users)
            .where(or(eq(users.username, username), eq(users.name, username)))
            .limit(1);

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 })
        }

        const history = await drizzledb
            .select({ symbol: searchHistory.symbol, createdAt: searchHistory.createdAt })
            .from(searchHistory)
            .where(eq(searchHistory.userId, user.id))
            .orderBy(desc(searchHistory.createdAt))
            .limit(10);

        return NextResponse.json(history)
    } catch (error: any) {
        console.error("Search history fetch error:", error)
        return NextResponse.json({ message: "Error fetching history" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession()

    if (!session?.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const { symbol } = await req.json()

        if (!symbol) {
            return NextResponse.json({ message: "Symbol is required" }, { status: 400 })
        }

        const username = (session.user as any).username || session.user.name;
        const [user] = await drizzledb
            .select({ id: users.id })
            .from(users)
            .where(or(eq(users.username, username), eq(users.name, username)))
            .limit(1);

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 })
        }

        // Insert new search
        await drizzledb.insert(searchHistory).values({
            userId: user.id,
            symbol: symbol,
        });

        // Keep only last 10
        const top10 = drizzledb
            .select({ id: searchHistory.id })
            .from(searchHistory)
            .where(eq(searchHistory.userId, user.id))
            .orderBy(desc(searchHistory.createdAt))
            .limit(10);

        await drizzledb
            .delete(searchHistory)
            .where(notInArray(searchHistory.id, top10));

        return NextResponse.json({ message: "Search saved" })
    } catch (error: any) {
        console.error("Search history save error:", error)
        return NextResponse.json({ message: "Error saving history" }, { status: 500 })
    }
}
export async function DELETE() {
    const session = await getServerSession()

    if (!session?.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const username = (session.user as any).username || session.user.name;
        const [user] = await drizzledb
            .select({ id: users.id })
            .from(users)
            .where(or(eq(users.username, username), eq(users.name, username)))
            .limit(1);

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 })
        }

        await drizzledb
            .delete(searchHistory)
            .where(eq(searchHistory.userId, user.id));

        return NextResponse.json({ message: "History cleared" })
    } catch (error: any) {
        console.error("Search history clear error:", error)
        return NextResponse.json({ message: "Error clearing history" }, { status: 500 })
    }
}
