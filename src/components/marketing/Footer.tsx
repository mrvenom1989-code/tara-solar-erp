// src/components/marketing/Footer.tsx
import Link from "next/link";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="container px-4 py-12 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Column 1: Brand & Address */}
          <div className="space-y-4">
            {/* FIXED: Brand Colors to match Navbar */}
            <h3 className="text-2xl font-bold tracking-tight">
              <span className="text-[#65A30D]">TARA</span>
              <span className="text-[#F59E0B]">SOLAR</span>
            </h3>
            
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#65A30D] mt-1 shrink-0" />
              <p className="text-sm leading-relaxed">
                4B J. B. Complex, Opp. Nayra Petrol Pump,<br />
                Satlasana - 384330
              </p>
            </div>
            <a 
              href="https://maps.app.goo.gl/YnAS88yMP68axkUT7" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Button variant="outline" size="sm" className="mt-2 text-xs bg-slate-800 text-white">
                Get Directions
              </Button>
            </a>
          </div>

          {/* Column 2: Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Contact Us</h4>
            
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#F59E0B]" />
              <a href="tel:+919428956700" className="hover:text-white transition-colors">
                +91 94289 56700
              </a>
            </div>
            
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[#F59E0B]" />
              <a href="mailto:tara.solar.2111@gmail.com" className="hover:text-white transition-colors">
                tara.solar.2111@gmail.com
              </a>
            </div>

            <div className="pt-2">
              <a 
                href="https://wa.me/919428956700" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button className="bg-[#25D366] hover:bg-[#20bd5a] text-white gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Chat on WhatsApp
                </Button>
              </a>
            </div>
          </div>

          {/* Column 3: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/projects" className="hover:text-[#65A30D]">Our Projects</Link></li>
              <li><Link href="/subsidy" className="hover:text-[#65A30D]">Govt. Subsidy</Link></li>
              <li><Link href="/quote" className="hover:text-[#65A30D]">Get a Quote</Link></li>
              <li><Link href="/dashboard" className="hover:text-[#65A30D]">Staff Login</Link></li>
            </ul>
          </div>

        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Tara Solar Energy. All rights reserved.
        </div>
      </div>
    </footer>
  );
}