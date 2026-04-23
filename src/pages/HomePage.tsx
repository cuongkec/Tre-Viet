import React from "react";
import { motion } from "motion/react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Collections from "../components/Collections";
import AboutSection from "../components/StorySection";
import ProcessSection from "../components/ProcessSection";
import ContactSection from "../components/ContactSection";
import GalleryCarousel from "../components/GalleryCarousel";
import Footer from "../components/Footer";

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-editorial-bg">
      <Navbar />
      <Hero />
      <Collections />
      <AboutSection />
      <ProcessSection />
      <ContactSection />
      
      {/* Featured Quote Section */}
      <section className="py-40 px-[60px] text-center bg-editorial-bg border-y border-editorial-line/10">
        <div className="max-w-4xl mx-auto">
          <span className="text-editorial-accent text-[12px] uppercase tracking-[4px] font-semibold mb-12 block">Philosophy</span>
          <motion.blockquote 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-[42px] md:text-[62px] font-serif italic leading-tight text-editorial-text/90 px-4 mb-16"
          >
            "Sức mạnh của người Việt nằm ở sự dẻo dai như Tre, và vẻ đẹp của ngôi nhà Việt nằm ở sự chân phương của chất liệu."
          </motion.blockquote>
          <div className="flex justify-center items-center gap-6">
            <div className="w-16 h-px bg-editorial-line" />
            <cite className="not-italic text-[11px] uppercase tracking-[4px] font-bold text-editorial-text/40">CREATIVE DIRECTOR, TRE VIỆT</cite>
            <div className="w-16 h-px bg-editorial-line" />
          </div>
        </div>
      </section>

      <GalleryCarousel />

      <Footer />
    </main>
  );
}
