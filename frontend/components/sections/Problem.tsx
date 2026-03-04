"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Problem() {
    const problemRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: problemRef,
        offset: ["start end", "center center"],
    });

    const scale = useTransform(scrollYProgress, [0, 1], [0.4, 1]);
    const borderRadius = useTransform(scrollYProgress, [0, 1], ["4rem", "1.5rem"]);

    return (
        <section ref={problemRef} className="h-[200vh] bg-background relative z-10 -mt-20">
            <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center p-4 md:p-12 overflow-hidden">
                <motion.div
                    style={{ scale, borderRadius }}
                    className="w-full h-full flex flex-col items-center justify-center px-6 bg-foreground text-background origin-center overflow-hidden"
                >
                    <div className="max-w-4xl text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-8">Spreadsheets are failing you.</h2>
                        <p className="text-xl md:text-2xl text-background/80 leading-relaxed">
                            Lost equipment, expired warranties, and unchecked depreciation. When your assets are scattered across multiple systems, you lose time, money, and accountability.
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
