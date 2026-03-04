export default function HowItWorks() {
    return (
        <section className="min-h-[100vh] flex flex-col items-center justify-center px-6 bg-foreground text-background py-20">
            <div className="max-w-5xl w-full">
                <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center">How it works</h2>
                <div className="space-y-12">
                    {[
                        { step: "01", title: "Import Data", desc: "Upload your existing spreadsheets or connect your integrations. We map your data instantly." },
                        { step: "02", title: "Assign & Track", desc: "Check items out to employees, set maintenance schedules, and monitor locations." },
                        { step: "03", title: "Automate Insights", desc: "Receive automated alerts for warranties, lease expirations, and depreciation reports." }
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col md:flex-row gap-6 md:gap-12 items-start md:items-center">
                            <span className="text-6xl md:text-8xl font-bold text-background/20">{item.step}</span>
                            <div>
                                <h3 className="text-2xl md:text-3xl font-bold mb-2">{item.title}</h3>
                                <p className="text-lg md:text-xl text-background/70">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
