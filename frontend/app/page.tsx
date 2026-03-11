import Navbar from "@/components/Navbar";
import Hero from "@/components/sections/Hero";
import Problem from "@/components/sections/Problem";
import Solution from "@/components/sections/Solution";
import HowItWorks from "@/components/sections/HowItWorks";
import FeatureShowcase from "@/components/sections/FeatureShowcase";
import UseCases from "@/components/sections/UseCases";
import WhyInventra from "@/components/sections/WhyInventra";
import Pricing from "@/components/sections/Pricing";
import Testimonials from "@/components/sections/Testimonials";
import FinalCTA from "@/components/sections/FinalCTA";
import Footer from "@/components/sections/Footer";
import SmoothScroll from "@/components/SmoothScroll";

export default function Home() {
  return (
    <SmoothScroll>
    <div id="top" className="w-full min-h-screen">
      <Navbar />
      <Hero />
      <div id="problem"><Problem /></div>
      <div id="solution"><Solution /></div>
      <div id="how-it-works"><HowItWorks /></div>
      <div id="features"><FeatureShowcase /></div>
      <div id="use-cases"><UseCases /></div>
      <div id="why-inventra"><WhyInventra /></div>
      <div id="pricing"><Pricing /></div>
      <div id="testimonials"><Testimonials /></div>
      <FinalCTA />
      <Footer />
    </div>
    </SmoothScroll>
  );
}