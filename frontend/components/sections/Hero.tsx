"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
    const containerRef = useRef<HTMLElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        // Timeline that pins the section and scrubs based on scroll progress
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top top",
                end: "+=2500", // Scroll distance before unpinning
                scrub: 1,      // Smooth scrubbing
                pin: true,     // Pin the section
                anticipatePin: 1 // Prevent flash of unpinned content
            }
        });

        // The wrapper contains 4 words, each taking up 25% of the total height.
        // We push it up by -25%, -50%, and -75% to reveal the subsequent words.

        // Initial hold on the first word
        tl.to({}, { duration: 0.5 });

        // Move to 2nd word
        tl.to(wrapperRef.current, { yPercent: -25, duration: 1, ease: "power2.inOut" });
        tl.to({}, { duration: 0.5 }); // Hold 2nd word

        // Move to 3rd word
        tl.to(wrapperRef.current, { yPercent: -50, duration: 1, ease: "power2.inOut" });
        tl.to({}, { duration: 0.5 }); // Hold 3rd word

        // Move to 4th word
        tl.to(wrapperRef.current, { yPercent: -75, duration: 1, ease: "power2.inOut" });

        // Ensure the section STAYS pinned for a long period entirely on the last word 
        // to clearly communicate the complete sentence before the user scrolls past.
        tl.to({}, { duration: 2.0 });

    }, { scope: containerRef });

    const words = ["Asset", "Laptop", "Vehicle", "License"];

    return (
        <section ref={containerRef} className="h-screen flex flex-col justify-center px-6 md:px-20 bg-background text-foreground overflow-hidden relative z-0">
            <div className="max-w-6xl w-full mx-auto">
                <h1 className="text-[12vw] sm:text-6xl lg:text-[7vw] font-bold tracking-tighter leading-[1] uppercase flex flex-col">
                    <div className="mb-1 sm:mb-2">Track</div>
                    <div className="mb-1 sm:mb-2">Every</div>
                    {/* The dynamic wrapper */}
                    <div className="h-[1em] relative overflow-hidden text-foreground/40 mb-1 sm:mb-2">
                        <div ref={wrapperRef} className="absolute top-0 left-0 w-full flex flex-col">
                            {words.map((w, i) => (
                                <div key={i} className="h-[1em] leading-[1] pb-1">{w}.</div>
                            ))}
                        </div>
                    </div>
                    <div>Intelligently.</div>
                </h1>

                <div className="mt-10 sm:mt-16 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                    <button className="bg-foreground text-background px-6 py-3.5 sm:px-8 sm:py-4 rounded-full font-medium text-base sm:text-lg hover:opacity-90 transition-opacity w-full sm:w-auto">
                        Start Free Trial
                    </button>
                    <button className="border border-foreground/20 px-6 py-3.5 sm:px-8 sm:py-4 rounded-full font-medium text-base sm:text-lg hover:bg-foreground/5 transition-colors w-full sm:w-auto">
                        Contact Sales
                    </button>
                </div>
            </div>
        </section>
    );
}
