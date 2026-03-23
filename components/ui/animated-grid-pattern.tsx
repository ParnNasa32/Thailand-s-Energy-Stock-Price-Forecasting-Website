"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface AnimatedGridPatternProps {
    numSquares?: number;
    maxOpacity?: number;
    duration?: number;
    repeatDelay?: number;
    className?: string;
    [key: string]: any;
}

export function AnimatedGridPattern({
    numSquares = 50,
    maxOpacity = 0.5,
    duration = 4,
    repeatDelay = 0.5,
    className,
    ...props
}: AnimatedGridPatternProps) {
    const id = useId();
    const containerRef = useRef<SVGSVGElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [mounted, setMounted] = useState(false);
    const [squares, setSquares] = useState<{ id: number; pos: number[] }[]>([]);

    useEffect(() => {
        setMounted(true);
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                resizeObserver.unobserve(containerRef.current);
            }
        };
    }, []);

    const width = 40;
    const height = 40;
    const x = -1;
    const y = -1;
    const strokeDasharray = 0;

    const getPos = () => {
        if (dimensions.width === 0 || dimensions.height === 0) return [0, 0];
        return [
            Math.floor((Math.random() * dimensions.width) / width),
            Math.floor((Math.random() * dimensions.height) / height),
        ];
    };

    // Generate squares once dimensions are available and we are on the client
    useEffect(() => {
        if (mounted && dimensions.width > 0 && squares.length === 0) {
            const generateSquares = (count: number) => {
                return Array.from({ length: count }, (_, i) => ({
                    id: i,
                    pos: [
                        Math.floor((Math.random() * dimensions.width) / width),
                        Math.floor((Math.random() * dimensions.height) / height),
                    ],
                }));
            };
            setSquares(generateSquares(numSquares));
        }
    }, [mounted, dimensions, numSquares, squares.length]);

    const updateSquarePosition = (id: number) => {
        setSquares((currentSquares) =>
            currentSquares.map((sq) =>
                sq.id === id
                    ? {
                        ...sq,
                        pos: getPos(),
                    }
                    : sq
            )
        );
    };

    if (!mounted) return (
        <svg
            aria-hidden="true"
            className={cn(
                "pointer-events-none absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/30",
                className
            )}
            {...props}
        />
    );

    return (
        <svg
            ref={containerRef}
            aria-hidden="true"
            className={cn(
                "pointer-events-none absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/30",
                className
            )}
            {...props}
        >
            <defs>
                <pattern
                    id={id}
                    width={width}
                    height={height}
                    patternUnits="userSpaceOnUse"
                    x={x}
                    y={y}
                >
                    <path
                        d={`M.5 ${height}V.5H${width}`}
                        fill="none"
                        strokeDasharray={strokeDasharray}
                    />
                </pattern>
            </defs>
            <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
            <svg x={x} y={y} className="overflow-visible">
                {squares.map(({ pos: [sqX, sqY], id: sqId }, index) => (
                    <motion.rect
                        initial={{ opacity: 0 }}
                        animate={{ opacity: maxOpacity }}
                        transition={{
                            duration,
                            repeat: 1,
                            repeatType: "reverse",
                            ease: "circOut",
                            repeatDelay,
                            delay: (sqId % 10), // Use deterministic delay based on ID to avoid hydration mismatch
                        }}
                        onAnimationComplete={() => updateSquarePosition(sqId)}
                        key={`${sqX}-${sqY}-${sqId}`}
                        width={width - 1}
                        height={height - 1}
                        x={sqX * width + 1}
                        y={sqY * height + 1}
                        fill="currentColor"
                        strokeWidth="0"
                    />
                ))}
            </svg>
        </svg>
    );
}
