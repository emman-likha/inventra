"use client";

import { motion } from "framer-motion";

export function FloatingDots() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-foreground/[0.06]"
                    style={{
                        left: `${15 + i * 18}%`,
                        top: `${20 + (i % 3) * 25}%`,
                    }}
                    animate={{
                        y: [0, -20, 0],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 4 + i,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.8,
                    }}
                />
            ))}
        </div>
    );
}
