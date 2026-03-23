'use client'

import { signOut, useSession } from "next-auth/react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, User, Settings, LayoutDashboard } from "lucide-react"

export function UserMenu() {
    const { data: session } = useSession()

    if (!session?.user) return null

    const user = session.user
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-border/50">
                        <AvatarImage src={(user as any).image} alt={user.name || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 z-[9999]" align="start" side="bottom" avoidCollisions forceMount>
                <DropdownMenuLabel className="font-normal px-2 py-3">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none text-foreground">{user.name}</p>
                        <p className="text-[11px] leading-none text-muted-foreground font-medium">
                            @{(user as any).username || initials.toLowerCase()}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="opacity-50" />
                <DropdownMenuItem className="cursor-pointer gap-2 py-2 focus:bg-muted/60" onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
