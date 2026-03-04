export default function Pricing() {
    return (
        <section className="min-h-[100vh] flex flex-col items-center justify-center px-6 bg-foreground text-background py-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center">Simple pricing.</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full text-left">
                <div className="p-10 border border-background/20 rounded-3xl flex flex-col">
                    <h3 className="text-2xl font-bold mb-2">Startup</h3>
                    <p className="text-background/60 mb-8">Perfect for small teams tracking under 1,000 assets.</p>
                    <div className="text-5xl font-bold mb-8">$49<span className="text-xl text-background/60 font-normal">/mo</span></div>
                    <ul className="space-y-4 mb-10 flex-grow">
                        <li className="flex gap-3"><span className="text-background/50">❖</span> 1,000 Assets</li>
                        <li className="flex gap-3"><span className="text-background/50">❖</span> Basic Reporting</li>
                        <li className="flex gap-3"><span className="text-background/50">❖</span> Standard Support</li>
                    </ul>
                    <button className="w-full bg-background text-foreground py-4 rounded-full font-medium hover:opacity-90">Start Free Trial</button>
                </div>
                <div className="p-10 bg-background text-foreground rounded-3xl flex flex-col relative overflow-hidden">
                    <div className="bg-foreground text-background text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full self-start mb-4">Most Popular</div>
                    <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                    <p className="text-foreground/60 mb-8">For scaling organizations needing advanced features.</p>
                    <div className="text-5xl font-bold mb-8">$199<span className="text-xl text-foreground/60 font-normal">/mo</span></div>
                    <ul className="space-y-4 mb-10 flex-grow">
                        <li className="flex gap-3"><span className="text-foreground/30">❖</span> Unlimited Assets</li>
                        <li className="flex gap-3"><span className="text-foreground/30">❖</span> Custom Reporting & APIs</li>
                        <li className="flex gap-3"><span className="text-foreground/30">❖</span> Dedicated Success Manager</li>
                    </ul>
                    <button className="w-full bg-foreground text-background py-4 rounded-full font-medium hover:opacity-90">Contact Sales</button>
                </div>
            </div>
        </section>
    );
}
