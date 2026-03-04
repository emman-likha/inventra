export default function Footer() {
    return (
        <footer className="bg-foreground text-background py-12 px-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                <div className="col-span-1 md:col-span-2">
                    <div className="text-2xl font-bold mb-4 tracking-tight">Inventra</div>
                    <p className="text-background/60 max-w-xs">
                        Modern asset management for teams that demand excellence and simplicity.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold mb-4">Product</h4>
                    <ul className="space-y-2 text-background/60">
                        <li><a href="#" className="hover:text-background">Features</a></li>
                        <li><a href="#" className="hover:text-background">Pricing</a></li>
                        <li><a href="#" className="hover:text-background">Integrations</a></li>
                        <li><a href="#" className="hover:text-background">Changelog</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold mb-4">Company</h4>
                    <ul className="space-y-2 text-background/60">
                        <li><a href="#" className="hover:text-background">About</a></li>
                        <li><a href="#" className="hover:text-background">Legal</a></li>
                        <li><a href="#" className="hover:text-background">Contact</a></li>
                    </ul>
                </div>
            </div>
            <div className="max-w-6xl mx-auto pt-8 border-t border-background/10 text-background/40 flex flex-col md:flex-row justify-between items-center text-sm gap-4">
                <p>© {new Date().getFullYear()} Inventra Inc. All rights reserved.</p>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-background">Twitter</a>
                    <a href="#" className="hover:text-background">LinkedIn</a>
                </div>
            </div>
        </footer>
    );
}
