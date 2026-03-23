"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function LightRays({ className }: { className?: string }) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const isDark = theme === "dark";

    return (
        <div
            className={cn(
                "pointer-events-none absolute -inset-0 z-0 flex justify-center overflow-hidden opacity-100",
                className
            )}
            style={{ mixBlendMode: isDark ? "screen" : "multiply" }}
        >
            {/* Container for the rays */}
            <div className="absolute top-0 flex h-full w-[200%] flex-none justify-center">
                {/* The main conic gradient representing the rays spreading from top center */}
                <div
                    className="absolute inset-x-0 top-[-25%] h-[150%] origin-top animate-[pulse_10s_ease-in-out_infinite] opacity-15"
                    style={{
                        backgroundImage: `conic-gradient(from 90deg at 50% 0%, transparent 0%, ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)"
                            } 35%, transparent 50%, ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)"
                            } 65%, transparent 100%)`,
                    }}
                />

                {/* Core glow at the very top */}
                <div
                    className="absolute top-0 h-[40vh] w-[80vw] max-w-[1000px] animate-[pulse_6s_ease-in-out_infinite] blur-3xl opacity-20"
                    style={{
                        backgroundImage: `radial-gradient(ellipse at top, ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)"
                            } 0%, transparent 70%)`
                    }}
                />

                {/* Dynamic ambient beams to create parallax feeling */}
                <div
                    className="absolute top-0 h-[80vh] w-[40vw] max-w-[500px] animate-[pulse_8s_ease-in-out_infinite] blur-2xl opacity-15 rotate-[15deg] origin-top delay-1000"
                    style={{
                        backgroundImage: `radial-gradient(ellipse at top, ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
                            } 0%, transparent 80%)`
                    }}
                />
                <div
                    className="absolute top-0 h-[80vh] w-[40vw] max-w-[500px] animate-[pulse_7s_ease-in-out_infinite] blur-2xl opacity-15 -rotate-[15deg] origin-top delay-500"
                    style={{
                        backgroundImage: `radial-gradient(ellipse at top, ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
                            } 0%, transparent 80%)`
                    }}
                />

                {/* Fade out to the bottom so it blends into the background */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            </div>
        </div>
    );
}
