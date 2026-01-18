// src/components/marketing/Navbar.tsx
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone } from "lucide-react";

export function Navbar() {
  return (
    // Fixed: Changed supports-[backdrop-filter] to supports-backdrop-filter
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60 dark:bg-slate-950/95 dark:border-slate-800">
      <div className="container flex h-20 items-center justify-between px-4 md:px-6">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-10 w-10 overflow-hidden">
             <Image src="/logo.png" alt="Tara Solar" fill className="object-contain"/>
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:inline-block">
            <span className="text-[#65A30D]">TARA</span>
            <span className="text-[#F59E0B]">SOLAR</span>
          </span>
        </Link>

        {/* CENTER LINKS (Desktop) */}
        <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link href="/services" className="hover:text-[#65A30D] transition-colors">Services</Link>
          <Link href="/projects" className="hover:text-[#65A30D] transition-colors">Projects</Link>
          <Link href="/subsidy" className="hover:text-[#65A30D] transition-colors">Subsidy</Link>
          <Link href="/about" className="hover:text-[#65A30D] transition-colors">About Us</Link>
        </div>

        {/* RIGHT CONTACT ACTIONS */}
        <div className="flex items-center gap-3">
          
          {/* Phone (Hidden on very small screens) */}
          <div className="hidden md:flex flex-col items-end mr-2 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> +91 94289 56700</span>
            <span className="text-slate-400">tara.solar.2111@gmail.com</span>
          </div>

          {/* Staff Login Button */}
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
               Login
            </Button>
          </Link>

          {/* WhatsApp Button */}
          <a href="https://wa.me/919428956700" target="_blank" rel="noopener noreferrer">
            <Button size="icon" className="bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full">
              <MessageCircle className="w-5 h-5" />
            </Button>
          </a>

          {/* Quote Button */}
          <Link href="/quote">
            <Button className="bg-[#65A30D] hover:bg-[#4d7c0f] text-white">
              Get Quote
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}