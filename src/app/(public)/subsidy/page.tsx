// src/app/(public)/subsidy/page.tsx
import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, IndianRupee, ArrowRight } from "lucide-react";

export default function SubsidyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col">
      <Navbar />

      {/* HEADER SECTION - UPDATED: Using Light Green Tint */}
      <section className="bg-[#65A30D]/10 py-20 text-center border-b border-green-100 dark:border-green-900">
        <div className="container px-4 mx-auto">
          <span className="inline-block px-4 py-1 mb-4 text-sm font-semibold bg-[#65A30D] text-white rounded-full">
            PM Surya Ghar: Muft Bijli Yojana
          </span>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-5xl">
            Get up to <span className="text-[#65A30D]">₹78,000</span> Subsidy
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            The Government of India now provides direct financial assistance to homeowners for installing rooftop solar panels.
          </p>
        </div>
      </section>

      {/* SUBSIDY BREAKDOWN */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Subsidy Structure (2025-26)</h2>
            <p className="text-slate-600 dark:text-slate-400">Based on system capacity</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tier 1 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <IndianRupee className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">1 kW System</h3>
              <div className="my-4 text-4xl font-extrabold text-[#65A30D]">₹30,000</div>
              <p className="text-sm text-slate-500">Fixed subsidy amount</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-green-500"/> Suitable for small homes</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-green-500"/> Saves ~₹1,500 / month</li>
              </ul>
            </div>

            {/* Tier 2 */}
            <div className="relative bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border-2 border-[#65A30D]">
              <div className="absolute top-0 right-0 bg-[#65A30D] text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg">
                MOST POPULAR
              </div>
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <IndianRupee className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">2 kW System</h3>
              <div className="my-4 text-4xl font-extrabold text-[#65A30D]">₹60,000</div>
              <p className="text-sm text-slate-500">Fixed subsidy amount</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-green-500"/> Ideal for 2-3 BHK</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-green-500"/> Saves ~₹3,000 / month</li>
              </ul>
            </div>

            {/* Tier 3 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
                <IndianRupee className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">3 kW & Above</h3>
              <div className="my-4 text-4xl font-extrabold text-[#65A30D]">₹78,000</div>
              <p className="text-sm text-slate-500">Max subsidy cap</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-green-500"/> For large homes/villas</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-green-500"/> Run ACs & Geysers</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS STEPS */}
      <section className="py-16 bg-white dark:bg-slate-900 flex-1">
        <div className="container px-4 mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center text-slate-900 dark:text-white">How to Claim?</h2>
            
            <div className="space-y-8">
                {/* Step 1 */}
                <div className="flex gap-4">
                    <div className="flex-none w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">1</div>
                    <div>
                        <h4 className="text-xl font-semibold text-slate-900 dark:text-white">Register on National Portal</h4>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            We assist you in registering on <span className="text-blue-500">pmsuryaghar.gov.in</span>. You will need your Electricity Consumer Number.
                        </p>
                    </div>
                </div>

                 {/* Step 2 */}
                 <div className="flex gap-4">
                    <div className="flex-none w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">2</div>
                    <div>
                        <h4 className="text-xl font-semibold text-slate-900 dark:text-white">Installation by Tara Solar</h4>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            As a registered vendor, we install the system and commission the Net Metering with your local DISCOM (e.g., UGVCL, TORRENT).
                        </p>
                    </div>
                </div>

                 {/* Step 3 */}
                 <div className="flex gap-4">
                    <div className="flex-none w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center font-bold text-green-600">3</div>
                    <div>
                        <h4 className="text-xl font-semibold text-slate-900 dark:text-white">Subsidy Disbursement</h4>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Once inspected, the government credits the subsidy amount directly to your bank account within 30 days.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center">
                <Link href="/quote">
                    <Button size="lg" className="h-14 px-10 text-lg bg-[#65A30D] hover:bg-[#4d7c0f] text-white rounded-full">
                        Check Eligibility Now <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </Link>
            </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}