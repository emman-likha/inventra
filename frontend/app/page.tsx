"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Home() {
  const problemRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: problemRef,
    offset: ["start end", "center center"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const borderRadius = useTransform(scrollYProgress, [0, 1], ["4rem", "0rem"]);

  return (
    <div className="flex flex-col w-full min-h-screen">

      {/* 1. Hero */}
      <section className="min-h-[100vh] flex flex-col items-center justify-center text-center px-6 relative py-20">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Intelligence for <br /> Every Asset
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
      </section>

      {/* 2. Problem */}
      <section ref={problemRef} className="py-10 md:py-20 bg-background overflow-hidden relative">
        <motion.div
          style={{ scale, borderRadius }}
          className="min-h-[90vh] flex flex-col items-center justify-center px-6 bg-foreground text-background origin-center"
        >
          <div className="max-w-4xl text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">Spreadsheets are failing you.</h2>
            <p className="text-xl md:text-2xl text-background/80 leading-relaxed">
              Lost equipment, expired warranties, and unchecked depreciation. When your assets are scattered across multiple systems, you lose time, money, and accountability.
            </p>
          </div>
        </motion.div>
      </section>

      {/* 3. Solution */}
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

      {/* 4. How It Works */}
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

      {/* 5. Feature Showcase */}
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

      {/* 6. Use Cases */}
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

      {/* 7. Why Inventra */}
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

      {/* 8. Pricing */}
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

      {/* 9. Testimonials */}
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

      {/* 10. Final CTA */}
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

      {/* 11. Footer */}
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

    </div>
  );
}