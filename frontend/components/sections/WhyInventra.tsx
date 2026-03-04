export default function WhyInventra() {
    return (
        <section className="min-h-[100vh] flex flex-col items-center justify-center px-6 text-center py-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">Why Inventra?</h2>
            <p className="text-xl md:text-2xl text-foreground/70 max-w-3xl mb-16">
                We strip away the bloat of legacy ERPs and give you a fast, intuitive, consumer-grade experience for enterprise-grade asset management.
            </p>
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-foreground mb-8">
                <span className="text-4xl font-bold">10x</span>
            </div>
            <p className="text-xl font-medium">Faster onboarding than competitors.</p>
        </section>
    );
}
