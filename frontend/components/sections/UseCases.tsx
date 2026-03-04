export default function UseCases() {
    return (
        <section className="min-h-[100vh] flex flex-col items-center justify-center px-6 bg-foreground text-background py-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center">Built for modern teams.</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
                {[
                    { team: "IT Departments", use: "Manage laptops, servers, software licenses, and hardware warranties." },
                    { team: "Facilities", use: "Track HVAC, furniture, security systems, and schedule routine maintenance." },
                    { team: "Finance", use: "Calculate depreciation for tax purposes and audit physical assets accurately." }
                ].map((item, i) => (
                    <div key={i} className="p-8 border border-background/20 rounded-3xl">
                        <h3 className="text-2xl font-bold mb-4">{item.team}</h3>
                        <p className="text-background/70 text-lg">{item.use}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
