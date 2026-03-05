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

export default function Home() {
  return (
    <div className="w-full min-h-screen">
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <FeatureShowcase />
      <UseCases />
      <WhyInventra />
      <Pricing />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </div>
  );
}