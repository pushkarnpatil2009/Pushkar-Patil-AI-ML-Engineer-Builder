/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import FeaturedArticle from "./components/FeaturedArticle";
import Projects from "./components/Projects";
import Resume from "./components/Resume";
import Achievements from "./components/Achievements";
import Certifications from "./components/Certifications";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import ScrollReveal from "./components/ScrollReveal";
import AICopilot from "./components/AICopilot";

import { CMSProvider, useCMS } from "./context/CMSContext";
import AdminDashboard from "./components/AdminDashboard";
import Login from "./components/Login";
import { Loader2 } from "lucide-react";

function AppContent() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedSkillName, setSelectedSkillName] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const { user, isAdmin, loading } = useCMS();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Keep spotlight relative to absolute viewport
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener("pointermove", handleMouseMove);
    
    // Listen for manual back/forward navigation
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handleLocationChange);
    
    // Intercept internal link clicks to route seamlessly without a full reload
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (href && href.startsWith("/") && !href.startsWith("//")) {
          e.preventDefault();
          window.history.pushState(null, "", href);
          setCurrentPath(href);
        }
      }
    };
    document.addEventListener("click", handleLinkClick);

    return () => {
      window.removeEventListener("pointermove", handleMouseMove);
      window.removeEventListener("popstate", handleLocationChange);
      document.removeEventListener("click", handleLinkClick);
    };
  }, []);

  const isAdminPath = currentPath === "/admin" || currentPath.startsWith("/admin/");

  // Protected Route: If non-authenticated trying to access /admin
  useEffect(() => {
    if (isAdminPath && !loading) {
      if (!user || !isAdmin) {
        window.history.pushState(null, "", "/login");
        setCurrentPath("/login");
      } else if (currentPath === "/admin") {
        window.history.pushState(null, "", "/admin/dashboard");
        setCurrentPath("/admin/dashboard");
      }
    }
  }, [isAdminPath, currentPath, user, isAdmin, loading]);

  if (currentPath === "/login") {
    return <Login />;
  }

  if (isAdminPath) {
    if (loading) {
      return (
        <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center gap-4 text-white">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
          <span className="font-mono text-xs tracking-widest text-zinc-400 uppercase">Verifying system access tokens...</span>
        </div>
      );
    }
    if (!user || !isAdmin) {
      return null; // Will trigger the redirect via useEffect
    }
    return <AdminDashboard />;
  }

  return (
    <div className="relative min-h-screen bg-[#030303] selection:bg-purple-500/30 selection:text-white" id="portfolio-app-root">
      
      {/* Dynamic Cursor Spotlight background halo (Stripe/Vercel effect) */}
      <div
        className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-500 hidden md:block"
        style={{
          background: `radial-gradient(450px at ${mousePosition.x}px ${mousePosition.y}px, rgba(96, 165, 250, 0.05) 0%, rgba(147, 51, 234, 0.03) 40%, transparent 100%)`,
        }}
        id="cursor-spotlight-overlay"
      />

      {/* Decorative top grid flare line */}
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent z-40" />

      {/* Navigation Header */}
      <Navbar />

      {/* Page Content layout wrapper */}
      <main className="w-full" id="portfolio-sections-container">
        
        {/* Section 1: Hero view - enters instantly with subtle fade-up */}
        <ScrollReveal duration={0.9} yOffset={20}>
          <Hero />
        </ScrollReveal>

        {/* Section 2: About Me view */}
        <ScrollReveal yOffset={35}>
          <About />
        </ScrollReveal>

        {/* Section 3: Skills deck */}
        <ScrollReveal yOffset={35}>
          <Skills selectedSkillName={selectedSkillName} onSelectSkillName={setSelectedSkillName} />
        </ScrollReveal>

        {/* Section 4: Featured article Pulse block */}
        <ScrollReveal yOffset={35}>
          <FeaturedArticle />
        </ScrollReveal>

        {/* Section 5: Projects slots blueprints */}
        <ScrollReveal yOffset={35}>
          <Projects selectedSkillName={selectedSkillName} />
        </ScrollReveal>

        {/* Section 5.5: Resume Section (Experience & Education) */}
        <ScrollReveal yOffset={35}>
          <Resume />
        </ScrollReveal>

        {/* Section 6: Achievements Challenge participant badge */}
        <ScrollReveal yOffset={30}>
          <Achievements />
        </ScrollReveal>

        {/* Section 7: Professional Certifications Vault */}
        <ScrollReveal yOffset={35}>
          <Certifications selectedSkillName={selectedSkillName} onSelectSkillName={setSelectedSkillName} />
        </ScrollReveal>

        {/* Section 8: Message contact terminal dispatcher */}
        <ScrollReveal yOffset={35}>
          <Contact />
        </ScrollReveal>

      </main>

      {/* Floating AI portfolio copilot panel */}
      <AICopilot />

      {/* Section 8: Minimal portfolio footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <CMSProvider>
      <AppContent />
    </CMSProvider>
  );
}
