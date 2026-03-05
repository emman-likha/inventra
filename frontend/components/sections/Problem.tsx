"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Problem() {
    const sectionRef = useRef<HTMLElement>(null);
    const boxRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        // Scale and un-round as it scrolls from bottom to top
        gsap.fromTo(boxRef.current,
            { scale: 0.4, borderRadius: "120px" },
            {
                scale: 1,
                borderRadius: "48px", // Keep it explicitly rounded at max scale!
                ease: "none",
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top bottom",
                    end: "top top",
                    scrub: true,
                }
            }
        );

        // Pin the section once it hits the top of the viewport
        ScrollTrigger.create({
            trigger: sectionRef.current,
            start: "top top",
            end: "+=1500", // Pinned duration length
            pin: true,
            anticipatePin: 1
        });

    }, { scope: sectionRef });

    return (
        <section ref={sectionRef} className="h-screen bg-background relative z-10 flex flex-col items-center justify-center p-4 md:p-10 overflow-hidden">
            {/* The box itself explicitly stops at 90-95% viewport so the corners are always visible! */}
            <div
                ref={boxRef}
                className="w-full h-full md:w-[92vw] md:h-[92vh] flex flex-col items-center justify-center px-6 bg-foreground text-background origin-center overflow-hidden"
            >
                <div className="max-w-4xl text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">Spreadsheets are failing you.</h2>
                    <p className="text-xl md:text-2xl text-background/80 leading-relaxed">
                        Lost equipment, expired warranties, and unchecked depreciation. When your assets are scattered across multiple systems, you lose time, money, and accountability.
                    </p>
                </div>
            </div>
        </section>
    );
}
