export default function FeatureShowcase() {
    return (
        <section className="min-h-[100vh] flex flex-col items-center justify-center px-6 py-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center">Everything you need. <br /> Nothing you don't.</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full">
                {[
                    "Check-in & Check-out", "Maintenance Tracking",
                    "Warranty Management", "Depreciation Calculator",
                    "Custom Reporting", "Role-based Access"
                ].map((feature, i) => (
                    <div key={i} className="bg-foreground/5 p-8 rounded-3xl flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 6L9 17L4 12" stroke="var(--background)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="text-xl font-medium">{feature}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
