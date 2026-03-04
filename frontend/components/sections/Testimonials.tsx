export default function Testimonials() {
    return (
        <section className="min-h-[100vh] flex flex-col items-center justify-center px-6 py-20 bg-foreground/5">
            <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center">Trusted by the best.</h2>
            <div className="max-w-4xl text-center">
                <p className="text-2xl md:text-4xl font-medium leading-tight mb-8">
                    "Inventra totally transformed how we track our hardware. We went from three corrupted spreadsheets to one seamless dashboard. I can't imagine going back."
                </p>
                <div className="font-bold text-xl">Sarah Jenkins</div>
                <div className="text-foreground/60">IT Director, TechFlow Inc.</div>
            </div>
        </section>
    );
}
