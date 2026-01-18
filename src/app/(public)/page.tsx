// src/app/(public)/page.tsx
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { ArrowRight, Home, Factory, Mountain,Sun,Wrench,Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col">
      <Navbar />
      
      {/* HERO SECTION */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-white dark:bg-slate-900">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm font-medium text-green-700 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-400">
                <span className="relative flex w-2 h-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Leading Solar Installer Across India
              </div>
              
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
                Powering India's Future<br/>
                <span className="text-[#F59E0B]">One Roof at a Time</span>
              </h1>
              
              <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
                From residential rooftops to massive industrial solar farms. 
                Tara Solar delivers premium engineering and guaranteed ROI.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 justify-center lg:justify-start">
                <Link href="/quote">
                  <Button size="lg" className="h-12 px-8 text-lg bg-[#65A30D] hover:bg-[#4d7c0f] text-white">
                    Start Your Savings
                  </Button>
                </Link>
                <Link href="/projects">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
                    View Portfolio
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none">
              <div className="relative rounded-2xl bg-slate-200 dark:bg-slate-800 aspect-video overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800">
                <Image 
                  src="/images/hero.jpg"
                  alt="Rooftop Solar Installation in India"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

{/* NEW: SERVICES PREVIEW SECTION */}
      <section className="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="container px-4 mx-auto text-center">
           <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12">Complete Energy Solutions</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Service 1 */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors group cursor-pointer">
                 <div className="w-12 h-12 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                    <Sun className="w-6 h-6 text-[#F59E0B]" />
                 </div>
                 <h3 className="font-bold text-lg mb-2">Solar Installations</h3>
                 <p className="text-slate-500 text-sm">Rooftop & Ground mounted systems for all sectors.</p>
              </div>

              {/* Service 2 */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors group cursor-pointer">
                 <div className="w-12 h-12 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                    <Wrench className="w-6 h-6 text-[#65A30D]" />
                 </div>
                 <h3 className="font-bold text-lg mb-2">Operations & Maintenance</h3>
                 <p className="text-slate-500 text-sm">Cleaning & technical maintenance to maximize generation.</p>
              </div>

               {/* Service 3 */}
               <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors group cursor-pointer">
                 <div className="w-12 h-12 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-blue-600" />
                 </div>
                 <h3 className="font-bold text-lg mb-2">HT Line Work</h3>
                 <p className="text-slate-500 text-sm">33kV/11kV transmission lines & substation erection.</p>
              </div>
           </div>

           <div className="mt-10">
              <Link href="/services">
                 <Button variant="link" className="text-[#65A30D] font-bold text-lg">
                    View All Services <ArrowRight className="ml-2 w-4 h-4" />
                 </Button>
              </Link>
           </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
             <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Our Impact</h2>
             <p className="text-slate-600 mt-2">Delivering excellence across all sectors</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Residential */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border-t-4 border-[#65A30D]">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Home className="w-6 h-6 text-[#65A30D]" />
              </div>
              <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Residential</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold text-[#65A30D]">1,000+</div>
                  <div className="text-sm text-slate-500">Homes Powered</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#65A30D]">3.5 MW</div>
                  <div className="text-sm text-slate-500">Capacity Installed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#65A30D]">₹13.5 Cr+</div>
                  <div className="text-sm text-slate-500">Client Savings</div>
                </div>
              </div>
            </div>

            {/* Industrial */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border-t-4 border-slate-600">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Factory className="w-6 h-6 text-slate-700" />
              </div>
              <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Industrial</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold text-slate-700 dark:text-slate-300">100+</div>
                  <div className="text-sm text-slate-500">Industries Powered</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-700 dark:text-slate-300">30+ MW</div>
                  <div className="text-sm text-slate-500">Capacity Installed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-700 dark:text-slate-300">₹130 Cr+</div>
                  <div className="text-sm text-slate-500">Client Savings</div>
                </div>
              </div>
            </div>

            {/* Ground Projects */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border-t-4 border-[#F59E0B]">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                <Mountain className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Ground Projects</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold text-[#F59E0B]">28+</div>
                  <div className="text-sm text-slate-500">Ground Projects</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#F59E0B]">175+ MW</div>
                  <div className="text-sm text-slate-500">Capacity Installed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#F59E0B]">₹780 Cr+</div>
                  <div className="text-sm text-slate-500">Client Savings</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION - UPDATED: Now using the Light Green Tint */}
      <section className="py-20 bg-[#65A30D]/10 border-t border-green-100 dark:border-green-900 mt-auto">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Start saving today
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-lg">
            Join the solar revolution with Gujarat's most trusted installer.
          </p>
          <div className="mt-8">
            <Link href="/quote">
              {/* Button is now Solid Green to contrast with Light Green BG */}
              <Button size="lg" className="h-14 px-10 text-xl font-bold bg-[#65A30D] text-white hover:bg-[#558b0b] rounded-full shadow-lg">
                Get Free Quote <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}