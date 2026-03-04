export default function Hero() {
    return (
        <section className="min-h-[100vh] flex flex-col items-center justify-center text-center px-6 relative py-20 overflow-hidden bg-background">
            <div className="relative z-10 flex flex-col items-center">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 uppercase" style={{ fontFamily: "'Syncopate', sans-serif" }}>
                    Intelligence<br />for Every Asset
                </h1>
                <p className="text-xl md:text-2xl text-foreground/70 max-w-2xl mb-10">
                    The cleanest, most powerful platform to track, manage, and optimize your company’s physical and digital resources.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button className="bg-foreground text-background px-8 py-4 rounded-full font-medium text-lg hover:opacity-90 transition-opacity">
                        Start Free Trial
                    </button>
                    <button className="border border-foreground/20 px-8 py-4 rounded-full font-medium text-lg hover:bg-foreground/5 transition-colors">
                        Contact Sales
                    </button>
                </div>
            </div>
        </section>
    );
}
