import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GithubProvider from "next-auth/providers/github"
import { drizzledb } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq, or } from "drizzle-orm"
import bcrypt from "bcryptjs"

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    throw new Error("Please enter an email and password")
                }

                const [user] = await drizzledb
                    .select()
                    .from(users)
                    .where(
                        or(
                            eq(users.username, credentials.username),
                            eq(users.email, credentials.username)
                        )
                    )
                    .limit(1);

                if (!user || !user.password) {
                    throw new Error("Invalid username or password")
                }

                const isValid = await bcrypt.compare(credentials.password, user.password)

                if (!isValid) {
                    throw new Error("Invalid password")
                }

                return {
                    id: user.id.toString(),
                    name: user.name || user.username,
                    username: user.username,
                }
            }
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        GithubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            try {
                if (account?.provider === "google" || account?.provider === "github") {
                    const email = user.email;
                    if (!email) return false;

                    // Check if user exists in our database
                    const [existingUser] = await drizzledb
                        .select()
                        .from(users)
                        .where(eq(users.email, email))
                        .limit(1);

                    if (!existingUser) {
                        // Create user if they don't exist
                        const baseUsername = email.split('@')[0];
                        await drizzledb.insert(users).values({
                            username: baseUsername + "_" + Math.random().toString(36).substring(7),
                            email: email,
                            name: user.name || baseUsername,
                        });
                    }
                }
                return true;
            } catch (error) {
                console.error("SignIn Callback Error:", error);
                return false;
            }
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id
                if (!(user as any).username && user.email) {
                    const [dbUser] = await drizzledb
                        .select()
                        .from(users)
                        .where(eq(users.email, user.email))
                        .limit(1);
                    if (dbUser) {
                        token.username = dbUser.username;
                        token.id = dbUser.id.toString();
                    }
                } else {
                    token.username = (user as any).username
                }
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).username = token.username;
            }
            return session
        }
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
