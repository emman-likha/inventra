export default function FinalCTA() {
    return (
        <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 py-20 relative">
            <div className="absolute inset-x-0 bottom-0 top-10 bg-foreground text-background rounded-t-[3rem] -z-10"></div>
            <div className="relative z-10 text-background pt-10">
                <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">Ready to take control?</h2>
                <p className="text-xl md:text-2xl text-background/80 max-w-2xl mx-auto mb-10">
                    Join thousands of companies managing their assets with absolute precision.
                </p>
                <button className="bg-background text-foreground px-10 py-5 rounded-full font-bold text-xl hover:scale-105 transition-transform">
                    Get Started Tracking
                </button>
            </div>
        </section>
    );
}
