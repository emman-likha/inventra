export default function Solution() {
    return (
        <section className="min-h-[100vh] flex flex-col items-center justify-center px-6 text-center py-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Enter Inventra.</h2>
            <p className="text-xl md:text-2xl text-foreground/70 max-w-3xl mb-16">
                A single source of truth for everything your business owns. Stop guessing and start knowing.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
                {[
                    { title: "Centralized tracking", desc: "View every asset from your laptop to your fleet of vehicles in one dashboard." },
                    { title: "Lifecycle management", desc: "Track purchase data, maintenance, depreciation, and disposal automatically." },
                    { title: "Instant clarity", desc: "Generate custom reports in seconds, not hours." }
                ].map((item, i) => (
                    <div key={i} className="p-8 border border-foreground/10 rounded-3xl text-left hover:border-foreground/30 transition-colors">
                        <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                        <p className="text-foreground/70 text-lg">{item.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
