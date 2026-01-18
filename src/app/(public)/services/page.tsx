// src/app/(public)/services/page.tsx
import Image from "next/image";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Wrench, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

const SERVICES = [
  {
    id: "installation",
    title: "Solar Installations",
    icon: Sun,
    color: "text-[#F59E0B]", // Gold
    bg: "bg-orange-50",
    description: "End-to-end EPC solutions for Residential, Commercial, and Utility-scale projects.",
    features: ["Site Survey & 3D Design", "Tier-1 Module Procurement", "Structure Fabrication", "Net Metering Liaison"],
  },
  {
    id: "om",
    title: "Operations & Maintenance",
    icon: Wrench,
    color: "text-[#65A30D]", // Green
    bg: "bg-green-50",
    description: "Comprehensive AMC packages to ensure your plant runs at peak efficiency for 25 years.",
    features: ["Module Cleaning (Robotic/Manual)", "Inverter Servicing", "Performance Monitoring", "Emergency Repairs"],
  },
  {
    id: "ht",
    title: "HT Line Work",
    icon: Zap,
    color: "text-blue-600", // Blue for Electric
    bg: "bg-blue-50",
    description: "Expert handling of High Tension transmission lines and substation infrastructure.",
    features: ["11kV / 33kV Line Erection", "Transformer Installation", "Liaisoning with DISCOMs (UGVCL, GETCO)", "Safety Audits"],
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col">
      <Navbar />

      {/* HEADER */}
      <section className="bg-[#65A30D]/10 py-20 text-center border-b border-green-100 dark:border-green-900">
        <div className="container px-4 mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white sm:text-5xl">Our Expertise</h1>
          <p className="mt-4 text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Comprehensive energy solutions from rooftop generation to grid transmission.
          </p>
        </div>
      </section>

      {/* DETAILED SERVICES GRID */}
      <section className="py-20 container px-4 mx-auto flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {SERVICES.map((service) => (
            <Card key={service.id} className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className={`${service.bg} border-b border-slate-100 dark:border-slate-800 py-8`}>
                <div className={`w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-4 ${service.color}`}>
                  <service.icon className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                  {service.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <p className="text-slate-600 dark:text-slate-300 mb-6 text-lg">
                  {service.description}
                </p>
                <ul className="space-y-3">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 ${service.color}`} />
                      <span className="text-sm font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA SECTION - UPDATED: Matches Global Landing Page (Light Green Tint) */}
      <section className="py-20 bg-[#65A30D]/10 border-t border-green-100 dark:border-green-900">
         <div className="container px-4 mx-auto text-center">
            {/* Title updated to Dark Slate for readability on light background */}
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Need a Custom Solution?</h2>
            <Link href="/quote">
               <Button size="lg" className="bg-[#65A30D] hover:bg-[#558b0b] text-white h-14 px-10 text-lg rounded-full shadow-lg">
                  Consult an Engineer <ArrowRight className="ml-2 w-5 h-5"/>
               </Button>
            </Link>
         </div>
      </section>

      <Footer />
    </div>
  );
}